require 'json'
require 'minitest/autorun'
require 'open3'
require 'rbconfig'
require 'socket'
require 'uri'
require_relative 'mercury_client'

class MockMercuryServer
  attr_reader :base_url

  def initialize(responses)
    @server = TCPServer.new('127.0.0.1', 0)
    @base_url = "http://127.0.0.1:#{@server.addr[1]}"
    @requests = Queue.new
    @thread = Thread.new do
      responses.each do |response|
        socket = @server.accept
        request_line = socket.gets.to_s.strip
        headers = {}
        while (line = socket.gets)
          line = line.strip
          break if line.empty?

          key, value = line.split(':', 2)
          headers[key.downcase] = value.to_s.strip
        end
        body = socket.read(headers.fetch('content-length', '0').to_i)
        method, target = request_line.split
        @requests << { method: method, target: target, headers: headers, body: body }

        payload = JSON.generate(response.fetch(:json, {}))
        status = response.fetch(:status, 200)
        socket.write(
          "HTTP/1.1 #{status} Test\r\n" \
          "Content-Type: application/json\r\n" \
          "Content-Length: #{payload.bytesize}\r\n" \
          "Connection: close\r\n\r\n#{payload}"
        )
        socket.close
      end
    ensure
      @server.close unless @server.closed?
    end
  end

  def next_request
    @requests.pop
  end

  def stop
    @thread.join(1)
    @server.close unless @server.closed?
    @thread.kill if @thread.alive?
    @thread.join
  end
end

class MercuryClientTest < Minitest::Test
  def test_reserve_use_and_release_contract
    server = MockMercuryServer.new([
      { json: { group: { id: 'group-1', devices: [{ serial: 'ios-1', ios: true }] } } },
      { json: { remoteConnectUrl: 'http://farm.test:8100' } },
      { json: { success: true } }
    ])
    client = MercuryClient.new(base_url: server.base_url, token: 'secret-token')

    reservation = client.reserve(
      run: 'ci run', timeout: 600, amount: 2, type: 'ios',
      run_url: 'https://ci.example/jobs/42', need_amount: true
    )
    assert_equal 'group-1', reservation[:group_id]
    assert_equal 'ios-1', reservation[:devices].first['serial']

    reserve_request = server.next_request
    reserve_uri = URI(reserve_request[:target])
    reserve_query = URI.decode_www_form(reserve_uri.query).to_h
    assert_equal 'GET', reserve_request[:method]
    assert_equal '/api/v1/autotests', reserve_uri.path
    assert_equal 'Bearer secret-token', reserve_request[:headers]['authorization']
    assert_equal({
      'run' => 'ci run',
      'timeout' => '600',
      'amount' => '2',
      'need_amount' => 'true',
      'type' => 'ios',
      'runUrl' => 'https://ci.example/jobs/42'
    }, reserve_query)

    assert_equal 'http://farm.test:8100', client.use_device('ios-1')
    use_request = server.next_request
    assert_equal 'POST', use_request[:method]
    assert_equal '/api/v1/autotests/useDevice', use_request[:target]
    assert_equal 'application/json', use_request[:headers]['content-type']
    assert_equal({ 'serial' => 'ios-1' }, JSON.parse(use_request[:body]))

    client.release('group-1')
    release_request = server.next_request
    release_uri = URI(release_request[:target])
    assert_equal 'DELETE', release_request[:method]
    assert_equal({ 'group' => 'group-1' }, URI.decode_www_form(release_uri.query).to_h)
  ensure
    server&.stop
  end

  def test_serials_take_precedence_over_filters
    server = MockMercuryServer.new([
      { json: { group: { id: 'group-2', devices: [{ serial: 'A' }, { serial: 'B' }] } } }
    ])
    client = MercuryClient.new(base_url: server.base_url, token: 'token')

    client.reserve(run: 'serial-run', serials: %w[A B], amount: 9, type: 'android')
    query = URI.decode_www_form(URI(server.next_request[:target]).query).to_h
    assert_equal 'A,B', query['serials']
    refute query.key?('amount')
    refute query.key?('need_amount')
    refute query.key?('type')
  ensure
    server&.stop
  end

  def test_http_errors_include_status_and_body
    server = MockMercuryServer.new([
      { status: 409, json: { success: false, description: 'Device is busy' } }
    ])
    client = MercuryClient.new(base_url: server.base_url, token: 'token')

    error = assert_raises(RuntimeError) do
      client.reserve(run: 'busy-run', amount: 1)
    end
    assert_includes error.message, 'HTTP 409'
    assert_includes error.message, 'Device is busy'
  ensure
    server&.stop
  end

  def test_single_run_auto_detects_ios_and_releases
    server = MockMercuryServer.new([
      { json: { group: { id: 'single-group', devices: [
        { serial: 'ios-1', model: 'iPhone', version: '18', ios: true }
      ] } } },
      { json: { remoteConnectUrl: 'http://farm.test:8100' } },
      { json: { success: true } }
    ])

    stdout, stderr, status = Open3.capture3(
      {
        'MERCURY_BASE_URL' => server.base_url,
        'MERCURY_TOKEN' => 'token',
        'MERCURY_SERIALS' => 'ios-1',
        'MERCURY_TYPE' => nil,
        'MERCURY_HOLD_SECONDS' => '0'
      },
      RbConfig.ruby,
      File.join(__dir__, 'single_run.rb')
    )

    assert status.success?, stderr
    assert_includes stdout, '[iOS] Appium capability'
    assert_includes stdout, 'Released group: single-group'
    assert_equal %w[GET POST DELETE], 3.times.map { server.next_request[:method] }
  ensure
    server&.stop
  end

  def test_single_run_releases_after_use_device_error
    server = MockMercuryServer.new([
      { json: { group: { id: 'failed-group', devices: [
        { serial: 'ios-1', model: 'iPhone', version: '18', ios: true }
      ] } } },
      { status: 500, json: { success: false, description: 'Device did not respond' } },
      { json: { success: true } }
    ])

    _stdout, stderr, status = Open3.capture3(
      {
        'MERCURY_BASE_URL' => server.base_url,
        'MERCURY_TOKEN' => 'token',
        'MERCURY_SERIALS' => 'ios-1',
        'MERCURY_TYPE' => nil,
        'MERCURY_HOLD_SECONDS' => '0'
      },
      RbConfig.ruby,
      File.join(__dir__, 'single_run.rb')
    )

    refute status.success?
    assert_includes stderr, 'HTTP 500'
    assert_equal %w[GET POST DELETE], 3.times.map { server.next_request[:method] }
  ensure
    server&.stop
  end

  def test_parallel_run_uses_and_releases_all_devices
    server = MockMercuryServer.new([
      { json: { group: { id: 'parallel-group', devices: [
        { serial: 'ios-1', model: 'iPhone 1', version: '18', ios: true },
        { serial: 'ios-2', model: 'iPhone 2', version: '18', ios: true }
      ] } } },
      { json: { remoteConnectUrl: 'http://farm.test:8101' } },
      { json: { remoteConnectUrl: 'http://farm.test:8102' } },
      { json: { success: true } }
    ])

    stdout, stderr, status = Open3.capture3(
      {
        'MERCURY_BASE_URL' => server.base_url,
        'MERCURY_TOKEN' => 'token',
        'MERCURY_SERIALS' => 'ios-1,ios-2',
        'MERCURY_TYPE' => nil,
        'MERCURY_HOLD_SECONDS' => '0'
      },
      RbConfig.ruby,
      File.join(__dir__, 'parallel_run.rb')
    )

    assert status.success?, stderr
    assert_includes stdout, '[ios-1] done / tamamlandı'
    assert_includes stdout, '[ios-2] done / tamamlandı'
    assert_includes stdout, 'Released group: parallel-group'
    requests = 4.times.map { server.next_request }
    assert_equal 1, requests.count { |request| request[:method] == 'GET' }
    assert_equal 2, requests.count { |request| request[:method] == 'POST' }
    assert_equal 1, requests.count { |request| request[:method] == 'DELETE' }
  ensure
    server&.stop
  end

  def test_device_type_uses_explicit_type_then_device_metadata
    client = MercuryClient.new(base_url: 'http://example.test', token: 'token')

    assert_equal 'android', client.device_type({ 'ios' => true }, requested: 'ANDROID')
    assert_equal 'ios', client.device_type({ 'ios' => true })
    assert_equal 'ios', client.device_type({ 'platform' => 'tvOS' })
    assert_equal 'ios', client.device_type({ 'manufacturer' => 'Apple' })
    assert_equal 'android', client.device_type({ 'platform' => 'Android' })
  end
end