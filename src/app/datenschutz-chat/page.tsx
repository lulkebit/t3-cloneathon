export default function DatenschutzChat() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Datenschutzerklärung Chat-Anwendung
        </h1>
        
        <div className="glass rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Ergänzung zur Hauptdatenschutzerklärung</h2>
            <p className="text-gray-300 leading-relaxed">
              Diese Datenschutzerklärung ergänzt die allgemeine Datenschutzerklärung von lukeschroeter.de 
              um spezifische Informationen zur Datenverarbeitung in der Chat-Anwendung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">1. Art der verarbeiteten Daten</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              In der Chat-Anwendung werden folgende personenbezogene Daten verarbeitet:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Benutzerkonto-Daten:</strong> E-Mail-Adresse, Benutzername (bei Registrierung über Supabase Auth)</li>
              <li><strong>Chat-Inhalte:</strong> Alle Nachrichten, die Sie in der Anwendung eingeben</li>
              <li><strong>Unterhaltungsverläufe:</strong> Gespeicherte Chat-Sitzungen mit Zeitstempeln</li>
              <li><strong>API-Konfiguration:</strong> Ihr OpenRouter API-Schlüssel (verschlüsselt gespeichert)</li>
              <li><strong>Datei-Uploads:</strong> Hochgeladene Anhänge und deren Metadaten</li>
              <li><strong>Nutzungsstatistiken:</strong> Informationen über verwendete Modelle und Häufigkeit der Nutzung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">2. Zweck der Datenverarbeitung</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Datenverarbeitung erfolgt zu folgenden Zwecken:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Bereitstellung der Chat-Funktionalität</li>
              <li>Speicherung und Wiederherstellung von Unterhaltungsverläufen</li>
              <li>Authentifizierung und Benutzerverwaltung</li>
              <li>Verbesserung der Anwendungsleistung</li>
              <li>Technische Wartung und Fehlerbehebung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">3. Rechtsgrundlage</h2>
            <p className="text-gray-300 leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) 
              und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung und Verbesserung 
              der Anwendung).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">4. Datenspeicherung und -sicherheit</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-purple-200 mb-2">Supabase (Datenbank)</h3>
                <p className="text-gray-300 leading-relaxed mb-2">
                  Alle Benutzerdaten werden in einer Supabase-Datenbank gespeichert:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Serverstandort: EU (DSGVO-konform)</li>
                  <li>Verschlüsselung: Daten werden verschlüsselt übertragen und gespeichert</li>
                  <li>Zugriffskontrolle: Strenge Authentifizierung und Autorisierung</li>
                  <li>API-Schlüssel werden zusätzlich verschlüsselt gespeichert</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-purple-200 mb-2">OpenRouter (KI-Modelle)</h3>
                <p className="text-gray-300 leading-relaxed mb-2">
                  Chat-Inhalte werden zur Verarbeitung an OpenRouter übertragen:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Übertragung erfolgt über Ihren eigenen API-Schlüssel</li>
                  <li>OpenRouter speichert Anfragen gemäß ihrer Datenschutzrichtlinie</li>
                  <li>Keine dauerhafte Speicherung von Chat-Inhalten bei OpenRouter</li>
                  <li>Weitere Informationen: <a href="https://openrouter.ai/privacy" className="text-purple-400 hover:text-purple-300">OpenRouter Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">5. Speicherdauer</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Speicherdauer richtet sich nach dem Zweck der Datenverarbeitung:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Chat-Verläufe:</strong> Bis zur Löschung durch den Nutzer oder Kontolöschung</li>
              <li><strong>Benutzerkonto:</strong> Bis zur Kontolöschung durch den Nutzer</li>
              <li><strong>API-Schlüssel:</strong> Bis zur Änderung oder Kontolöschung</li>
              <li><strong>Datei-Uploads:</strong> Bis zur manuellen Löschung oder Kontolöschung</li>
              <li><strong>Log-Daten:</strong> Maximal 30 Tage für technische Zwecke</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">6. Cookies und lokale Speicherung</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Anwendung verwendet folgende Cookies und lokale Speicherung:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Authentifizierungs-Cookies:</strong> Für die Anmeldung (Supabase Auth)</li>
              <li><strong>Session-Cookies:</strong> Für die Aufrechterhaltung der Sitzung</li>
              <li><strong>LocalStorage:</strong> Für UI-Einstellungen und temporäre Daten</li>
              <li><strong>Funktionale Cookies:</strong> Für die ordnungsgemäße Funktionalität der Anwendung</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Diese Cookies sind für die Funktionalität der Anwendung erforderlich und können nicht deaktiviert werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">7. Ihre Rechte</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Zusätzlich zu den in der Hauptdatenschutzerklärung genannten Rechten haben Sie folgende 
              spezifische Möglichkeiten:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Datenexport:</strong> Export aller Ihrer Chat-Verläufe über die Anwendung</li>
              <li><strong>Selektive Löschung:</strong> Löschung einzelner Unterhaltungen</li>
              <li><strong>Kontolöschung:</strong> Vollständige Löschung aller Daten über die Einstellungen</li>
              <li><strong>API-Schlüssel-Verwaltung:</strong> Jederzeit Änderung oder Entfernung möglich</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">8. Datenübertragung an Drittländer</h2>
            <p className="text-gray-300 leading-relaxed">
              Bei der Nutzung von KI-Modellen über OpenRouter können Daten an Drittländer übertragen werden, 
              je nach gewähltem Modell-Anbieter. Dies erfolgt ausschließlich über Ihren eigenen API-Schlüssel 
              und unter Ihrer direkten Kontrolle. Informationen zu den jeweiligen Modell-Anbietern finden Sie 
              in der OpenRouter-Dokumentation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">9. Datenschutz bei Minderjährigen</h2>
            <p className="text-gray-300 leading-relaxed">
              Die Anwendung richtet sich an Personen ab 16 Jahren. Personen unter 16 Jahren dürfen die 
              Anwendung nur mit Einwilligung ihrer Erziehungsberechtigten nutzen. Bei Kenntnis von 
              Datenverarbeitung Minderjähriger ohne entsprechende Einwilligung werden die Daten umgehend gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">10. Kontakt für Datenschutzfragen</h2>
            <p className="text-gray-300 leading-relaxed">
              Für Fragen zum Datenschutz in der Chat-Anwendung wenden Sie sich bitte an:
            </p>
            <div className="mt-3 p-4 bg-gray-800 rounded-lg">
              <p className="text-gray-300">
                <strong>Luke Schröter</strong><br />
                E-Mail: lukeschroeter05@gmail.com<br />
                Betreff: "Datenschutz Chat-Anwendung"
              </p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Stand: Juni 2025<br />
              Diese Datenschutzerklärung ergänzt die allgemeine Datenschutzerklärung von lukeschroeter.de
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 