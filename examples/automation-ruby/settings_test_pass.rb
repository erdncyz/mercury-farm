# ==============================================================================
# PASSING EXAMPLE TEST — opens the Settings app, taps into a sub-screen,
# verifies it, finishes with PASS (exit 0). Run flips to "Finished" on Builds.
#
# Usage:
#   gem install appium_lib_core
#   appium --address 127.0.0.1 --port 4723        # in another terminal
#   export MERCURY_BASE_URL=... MERCURY_TOKEN=... MERCURY_TYPE=android|ios
#   ruby settings_test_pass.rb
#
# ==============================================================================
# BAŞARILI ÖRNEK TEST — Ayarlar uygulamasını açar, bir alt ekrana (iOS'ta
# "Genel") girer, doğrular ve PASS ile biter (exit 0). Builds'de "Finished".
#
# Çalıştırma:
#   gem install appium_lib_core
#   appium --address 127.0.0.1 --port 4723        # ayrı bir terminalde
#   export MERCURY_BASE_URL=... MERCURY_TOKEN=... MERCURY_TYPE=android|ios
#   ruby settings_test_pass.rb
require_relative 'appium_session'

run_name = ENV.fetch('MERCURY_RUN', "settings-pass-#{Time.now.strftime('%Y%m%d-%H%M%S')}")

with_mercury_appium_session(run_name: run_name) do |driver, type|
  if type == 'ios'
    # Step 1: open Settings / Adım 1: Ayarlar'ı aç
    driver.activate_app('com.apple.Preferences')
    puts 'Settings opened / Ayarlar açıldı'

    # Step 2: tap "General" (cihaz diline göre "Genel")
    general = driver.find_element(
      :xpath,
      "//XCUIElementTypeCell[.//XCUIElementTypeStaticText[@name='General' or @name='Genel']]"
    )
    general.click
    puts "Tapped 'General' / 'Genel'e tıklandı"

    # Step 3: verify the General screen opened / Adım 3: Genel ekranı doğrula
    driver.find_element(
      :xpath,
      "//XCUIElementTypeNavigationBar[@name='General' or @name='Genel']"
    )
    puts 'General screen verified / Genel ekranı doğrulandı'
  else
    # Step 1: open Settings / Adım 1: Ayarlar'ı aç
    driver.activate_app('com.android.settings')
    puts 'Settings opened / Ayarlar açıldı'

    # Step 2: verify Settings is in the foreground / Adım 2: Ayarlar önde mi?
    package = driver.current_package
    raise "Settings not in foreground (got #{package})" unless package.include?('settings')

    # Step 3: tap the first visible settings entry (works on any language)
    # Adım 3: görünen ilk ayar satırına tıkla (her dilde çalışır)
    first_entry = driver.find_element(:xpath, '(//android.widget.TextView)[1]')
    entry_text = first_entry.text
    first_entry.click
    puts "Tapped '#{entry_text}' / '#{entry_text}' tıklandı"
  end

  puts ''
  puts '✅ TEST PASSED / TEST BAŞARILI'
end
