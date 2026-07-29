# ==============================================================================
# PARALLEL RUN — reserve N devices in one group, drive each in its own thread,
# then release the group once.
#
# Usage:
#   export MERCURY_BASE_URL=https://YOUR_DOMAIN
#   export MERCURY_TOKEN=...            # From UI > Settings > Keys > Access Tokens
#   export MERCURY_TYPE=android         # android | ios
#   export MERCURY_AMOUNT=2             # how many devices? (non-admins: max 2)
#   # To pick specific devices instead:
#   # export MERCURY_SERIALS=SERIAL_A,SERIAL_B
#   ruby parallel_run.rb
#
# For single-device run: single_run.rb
# More patterns (CI matrix etc): docs/parallel-execution.md
#
# ==============================================================================
# ÇOKLU (PARALEL) KOŞUM — N cihazı tek grupta ayır, her cihaz için ayrı
# thread'de bağlan/test koştur, sonunda grubu tek seferde bırak.
#
# Çalıştırma:
#   export MERCURY_BASE_URL=https://YOUR_DOMAIN
#   export MERCURY_TOKEN=...            # UI > Settings > Keys > Access Tokens
#   export MERCURY_TYPE=android         # android | ios
#   export MERCURY_AMOUNT=2             # kaç cihaz? (admin değilsen en fazla 2)
#   # Belirli cihazlar istersen:
#   # export MERCURY_SERIALS=SERIAL_A,SERIAL_B
#   ruby parallel_run.rb
#
# Tek cihazlık koşum için: single_run.rb
# Daha fazla desen (CI matrix vb.): docs/parallel-execution.md
require_relative 'mercury_client'

client   = MercuryClient.new
serials  = ENV['MERCURY_SERIALS'].to_s.split(',').map(&:strip).reject(&:empty?)
requested_type = ENV['MERCURY_TYPE']
run_name = ENV.fetch('MERCURY_RUN', "parallel-run-#{Time.now.strftime('%Y%m%d-%H%M%S')}")

reservation = client.reserve(
  run: run_name,                                  # Run name shown on Builds page / Builds sayfasında görünen isim
  run_url: ENV['CI_JOB_URL'],                     # Optional: clickable link on Builds / Opsiyonel: Builds'de tıklanabilir link
  project: ENV['MERCURY_PROJECT'],                # Optional: groups runs on Builds / Opsiyonel: Builds'de koşumları gruplar
  timeout: Integer(ENV.fetch('MERCURY_TIMEOUT', '900')), # Seconds / Saniye
  amount: Integer(ENV.fetch('MERCURY_AMOUNT', '2')),
  type: requested_type,                           # android | ios
  serials: serials,                               # If given, reserve exactly these devices / Veriliyse tam bu cihazlar ayrılır
  need_amount: true                               # All or nothing / Hepsi ya da hiçbiri
)

group_id = reservation[:group_id]
devices  = reservation[:devices]
puts "Group #{group_id} — #{devices.length} devices: #{devices.map { |d| d['serial'] }.join(', ')}"
# Grup #{group_id} — #{devices.length} cihaz: #{devices.map { |d| d['serial'] }.join(', ')}

begin
  threads = devices.map do |device|
    Thread.new do
      serial = device['serial']
      type = client.device_type(device, requested: requested_type)
      Thread.current.name = serial
      remote = client.use_device(serial)
      puts "[#{serial}] remoteConnectUrl: #{remote}"

      if type == 'ios'
        # iOS: capability for each Appium session:
        #   'appium:webDriverAgentUrl' => remote
        # iOS: her cihaz için Appium session'ında:
        #   'appium:webDriverAgentUrl' => remote
        puts "[#{serial}] Appium capability: 'appium:webDriverAgentUrl' => '#{remote}'"
      else
        # Android: adb must run on the MACHINE where Appium is running.
        # Android: adb, Appium'un çalıştığı MAKİNEDE bağlanmalı.
        system('adb', 'connect', remote) || raise("[#{serial}] adb connect failed / başarısız")
        # Appium capability: 'appium:udid' => remote
        # Note: for parallel Appium sessions, either use different 'appium:systemPort'
        # values in a single Appium instance or run a separate Appium port per device.
        # Not: paralel Appium session'ları için ya tek Appium'da farklı
        # 'appium:systemPort' değerleri ver ya da cihaz başına ayrı Appium portu aç.
      end

      # ---- TESTS FOR THIS DEVICE RUN HERE -----------------------------------
      # ---- BU CİHAZIN TESTLERİ BURADA KOŞAR --------------------------------
      sleep Integer(ENV.fetch('MERCURY_HOLD_SECONDS', '30')) # örnek amaçlı bekleme
      # ------------------------------------------------------------------------
      puts "[#{serial}] done / tamamlandı"
    end
  end

  errors = []
  threads.each do |t|
    begin
      t.join
    rescue StandardError => e
      errors << e
      warn "[#{t.name}] ERROR / HATA: #{e.message}"
    end
  end
  raise "#{errors.length} devices had errors / cihazda hata oluştu" unless errors.empty?
ensure
  # Group released in one call; $! reports PASSED/FAILED on Builds.
  # Grup tek çağrıyla bırakılır; $! Builds'de PASSED/FAILED rozeti olur.
  client.release(group_id, result: $! ? 'failed' : 'passed')
  puts "Released group: #{group_id} / Grup bırakıldı: #{group_id}"
end
