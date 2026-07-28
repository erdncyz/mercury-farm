# ==============================================================================
# SINGLE RUN — reserve one device, connect, run your tests, release.
#
# Usage:
#   export MERCURY_BASE_URL=https://YOUR_DOMAIN
#   export MERCURY_TOKEN=...            # From UI > Settings > Keys > Access Tokens
#   export MERCURY_TYPE=android         # android | ios (required for platform-specific runs)
#   # To pick a specific device instead of filtering by type:
#   # export MERCURY_SERIALS=R58N42ABCDE
#   ruby single_run.rb
#
# For multi-device parallel run: parallel_run.rb
#
# ==============================================================================
# TEKLİ KOŞUM — tek cihaz ayır, bağlan, testini koştur, bırak.
#
# Çalıştırma:
#   export MERCURY_BASE_URL=https://YOUR_DOMAIN
#   export MERCURY_TOKEN=...            # UI > Settings > Keys > Access Tokens
#   export MERCURY_TYPE=android         # android | ios (platforma özel koşularda şart)
#   # Belirli bir cihaz istersen filtre yerine serial ver:
#   # export MERCURY_SERIALS=R58N42ABCDE
#   ruby single_run.rb
#
# Çoklu/paralel koşum için: parallel_run.rb
require_relative 'mercury_client'

client   = MercuryClient.new
serials  = ENV['MERCURY_SERIALS'].to_s.split(',').map(&:strip).reject(&:empty?)
requested_type = ENV['MERCURY_TYPE']
run_name = ENV.fetch('MERCURY_RUN', "single-run-#{Time.now.strftime('%Y%m%d-%H%M%S')}")

reservation = client.reserve(
  run: run_name,                                  # Run name shown on Builds page / Builds sayfasında görünen isim
  run_url: ENV['CI_JOB_URL'],                     # Optional: clickable link on Builds / Opsiyonel: Builds'de tıklanabilir link
  timeout: Integer(ENV.fetch('MERCURY_TIMEOUT', '600')), # Seconds; run drops if not released / Saniye — koşum en geç bu sürede düşer
  amount: 1,
  type: requested_type,                           # android | ios
  serials: serials.first(1)                       # If given use that device; else filter by type / Veriliyse o cihaz; boşsa type'a göre seç
)

group_id = reservation[:group_id]
device   = reservation[:devices].first
serial   = device['serial']
type     = client.device_type(device, requested: requested_type)
puts "Reserved device: #{serial} (#{device['model']} / #{device['version']}) — group=#{group_id}"
# Ayrılan cihaz: #{serial} (#{device['model']} / #{device['version']}) — group=#{group_id}

begin
  remote = client.use_device(serial)
  puts "remoteConnectUrl: #{remote}"

  if type == 'ios'
    # iOS: capability for each Appium session:
    #   'appium:webDriverAgentUrl' => remote
    # iOS: her cihaz için Appium session'ında:
    #   'appium:webDriverAgentUrl' => remote
    puts "[iOS] Appium capability: 'appium:webDriverAgentUrl' => '#{remote}'"
  else
    # Android: adb must run on the MACHINE where Appium is running.
    # Android: adb, Appium'un çalıştığı MAKİNEDE bağlanmalı.
    system('adb', 'connect', remote) || raise('adb connect failed / adb connect başarısız')
    # Appium capability: 'appium:udid' => remote / Appium capability: 'appium:udid' => remote
  end

  # ---- TESTS RUN HERE -------------------------------------------------------
  # Open Appium session here (with appium_lib_core etc) and run your tests.
  # While running, the run shows as "Running" on Builds, screen can be watched live.
  # ---- TESTLERİNİZ BURADA KOŞAR --------------------------------------------
  # Appium session'ını burada aç (appium_lib_core vb.) ve testlerini çalıştır.
  # Koşum bu sırada Builds sayfasında "Running" görünür, ekran canlı izlenebilir.
  sleep Integer(ENV.fetch('MERCURY_HOLD_SECONDS', '30')) # örnek amaçlı bekleme
  # --------------------------------------------------------------------------
ensure
  client.release(group_id) # Device always released → run flips to "Finished" on Builds
  # Cihaz her durumda bırakılır → Builds'de "Finished"
  puts "Released group: #{group_id} / Grup bırakıldı: #{group_id}"
end
