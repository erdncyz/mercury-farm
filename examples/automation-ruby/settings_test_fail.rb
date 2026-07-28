# ==============================================================================
# FAILING EXAMPLE TEST — opens the Settings app, then looks for a menu item
# that DOES NOT exist. The element lookup times out, the test raises and the
# script exits non-zero (CI marks it red). The important part: the device is
# STILL released in the ensure block, so it never stays stuck as reserved.
#
# Usage: same as settings_test_pass.rb
#
# ==============================================================================
# BAŞARISIZ ÖRNEK TEST — Ayarlar'ı açar, sonra VAR OLMAYAN bir menü öğesi
# arar. Element bulunamayınca hata fırlar ve script exit 1 ile biter (CI
# kırmızı gösterir). Önemli olan: cihaz ensure bloğunda YİNE DE bırakılır,
# asla rezerve takılı kalmaz.
#
# Çalıştırma: settings_test_pass.rb ile aynı
require_relative 'appium_session'

run_name = ENV.fetch('MERCURY_RUN', "settings-fail-#{Time.now.strftime('%Y%m%d-%H%M%S')}")

begin
  with_mercury_appium_session(run_name: run_name) do |driver, type|
    # Step 1: open Settings / Adım 1: Ayarlar'ı aç
    app_id = type == 'ios' ? 'com.apple.Preferences' : 'com.android.settings'
    driver.activate_app(app_id)
    puts 'Settings opened / Ayarlar açıldı'

    # Step 2: look for a menu that does not exist — INTENTIONAL FAILURE.
    # Adım 2: olmayan bir menü ara — KASITLI HATA.
    driver.manage.timeouts.implicit_wait = 5 # fail fast / hızlı düşsün
    locator =
      if type == 'ios'
        [:xpath, "//XCUIElementTypeStaticText[@name='Nonexistent Menu Item']"]
      else
        [:xpath, "//android.widget.TextView[@text='Nonexistent Menu Item']"]
      end
    driver.find_element(*locator) # ← raises NoSuchElementError / hata fırlatır

    puts 'This line is never reached / Bu satıra asla gelinmez'
  end
rescue Selenium::WebDriver::Error::NoSuchElementError => e
  puts ''
  puts '❌ TEST FAILED (expected) / TEST BAŞARISIZ (beklenen)'
  puts "Reason / Sebep: element not found — #{e.message.lines.first&.strip}"
  puts 'Note / Not: device was still released above / cihaz yine de yukarıda bırakıldı'
  exit 1
end
