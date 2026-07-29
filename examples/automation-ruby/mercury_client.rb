# ==============================================================================
# Mercury Automation API Client (no extra gems required — Ruby stdlib only)
# Full documentation: docs/automation-api.md
#
# Environment variables (required):
#   MERCURY_BASE_URL  e.g. https://YOUR_DOMAIN  (without /#/ from UI)
#   MERCURY_TOKEN     From UI > Settings > Keys > Access Tokens
#
# ==============================================================================
# Mercury Otomasyon API İstemcisi (ek gem GEREKMEZ — saf Ruby stdlib)
# Tam doküman: docs/automation-api.md
#
# Ortam değişkenleri (zorunlu):
#   MERCURY_BASE_URL  örn. https://YOUR_DOMAIN  (UI'daki /#/ olmadan)
#   MERCURY_TOKEN     UI > Settings > Keys > Access Tokens
require 'json'
require 'net/http'
require 'uri'

class MercuryClient
  def initialize(base_url: ENV.fetch('MERCURY_BASE_URL'), token: ENV.fetch('MERCURY_TOKEN'))
    @base_url = base_url.sub(%r{/+$}, '')
    @token = token
  end

  # Reserve devices; the run appears on Builds page under the `run` name.
  # Two usage modes:
  #   1) amount + type      → pick from free devices by filter
  #   2) serials: [..]      → reserve specific devices by serial (ignores type/amount)
  # Return: { group_id:, devices: [...] } — keep group_id for release!
  #
  # Cihaz ayırır; koşum Builds sayfasında `run` adıyla görünür.
  # İki kullanım şekli:
  #   1) amount + type      → boştaki cihazlardan filtreyle seç
  #   2) serials: [..]      → belirli cihazları serial ile ayır (type/amount yok sayılır)
  # Dönen değer: { group_id:, devices: [...] } — release için group_id'yi sakla!
  def reserve(run:, timeout: 600, amount: nil, type: nil, serials: nil, run_url: nil, project: nil, need_amount: true)
    params = { run: run, timeout: timeout }
    if serials && !Array(serials).empty?
      params[:serials] = Array(serials).join(',')
    else
      params[:amount] = amount || 1
      params[:need_amount] = need_amount
      # 'android' | 'ios' — set for platform-specific runs, otherwise any free device
      # (including the other platform) can be picked.
      # 'android' | 'ios' — platforma özel koşularda MUTLAKA ver, yoksa
      # boştaki herhangi bir cihaz (diğer platform dahil) seçilebilir.
      params[:type] = type if type
    end
    params[:runUrl] = run_url if run_url && !run_url.empty?
    # Project groups runs on the Builds page — pass the name of the project
    # being run; its daily runs are listed under that header.
    # Project, Builds sayfasında koşumları gruplar — koştuğun projenin adını
    # gönder; günlük koşumları o başlık altında listelenir.
    params[:project] = project if project && !project.to_s.empty?

    body = request(:get, '/api/v1/autotests', params: params)
    group = body.fetch('group')
    devices = group['devices'] || []
    raise 'Cihaz ayrılamadı (devices boş döndü)' if devices.empty?

    { group_id: group.fetch('id'), devices: devices }
  end

  # Cihazı automation moduna alır.
  # Android → `adb connect <url>` için adres, iOS → appium:webDriverAgentUrl değeri döner.
  def use_device(serial)
    body = request(:post, '/api/v1/autotests/useDevice', body: { serial: serial })
    body.fetch('remoteConnectUrl')
  end

  # Release group and all devices inside; run flips to "Finished" on Builds.
  # Pass result: 'passed' | 'failed' to show a PASSED/FAILED badge on Builds.
  # Always call from ensure/finally block!
  #
  # Grubu ve içindeki tüm cihazları bırakır; Builds'de koşum "Finished" olur.
  # result: 'passed' | 'failed' verilirse Builds'de PASSED/FAILED rozeti görünür.
  # Her zaman ensure/finally içinde çağır!
  def release(group_id, result: nil)
    return unless group_id

    params = { group: group_id }
    params[:result] = result if %w[passed failed].include?(result.to_s)
    request(:delete, '/api/v1/autotests', params: params)
  end

  # Report scenario results for the run; they appear under the run on the
  # Builds page. Each entry: { name:, status: 'passed'|'failed'|'skipped',
  # durationSec: (optional), error: (optional) }. Replaces the previous list.
  #
  # Koşumun senaryo sonuçlarını raporlar; Builds sayfasında koşumun altında
  # görünür. Her kayıt: { name:, status: 'passed'|'failed'|'skipped',
  # durationSec: (opsiyonel), error: (opsiyonel) }. Önceki listeyi değiştirir.
  def report_scenarios(group_id, scenarios)
    return unless group_id

    request(:put, "/api/v1/builds/#{group_id}/scenarios", body: { scenarios: Array(scenarios) })
  end

  def device_type(device, requested: nil)
    requested = requested.to_s.downcase
    return requested if %w[android ios].include?(requested)

    platform = device['platform'].to_s.downcase
    return 'ios' if device['ios'] == true || %w[ios tvos].include?(platform)
    return 'ios' if device['manufacturer'].to_s.casecmp('Apple').zero?

    'android'
  end

  def device_type(device, requested: nil)
    requested = requested.to_s.downcase
    return requested if %w[android ios].include?(requested)

    platform = device['platform'].to_s.downcase
    return 'ios' if device['ios'] == true || %w[ios tvos].include?(platform)
    return 'ios' if device['manufacturer'].to_s.casecmp('Apple').zero?

    'android'
  end

  private

  def request(method, path, params: {}, body: nil)
    uri = URI("#{@base_url}#{path}")
    uri.query = URI.encode_www_form(params) unless params.empty?

    klass = { get: Net::HTTP::Get, post: Net::HTTP::Post, put: Net::HTTP::Put, delete: Net::HTTP::Delete }.fetch(method)
    req = klass.new(uri)
    req['Accept'] = 'application/json'
    req['Authorization'] = "Bearer #{@token}"
    if body
      req['Content-Type'] = 'application/json'
      req.body = JSON.generate(body)
    end

    res = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(req)
    end
    unless res.is_a?(Net::HTTPSuccess)
      raise "Mercury API #{method.to_s.upcase} #{path} -> HTTP #{res.code}: #{res.body}"
    end

    res.body.nil? || res.body.empty? ? {} : JSON.parse(res.body)
  end
end
