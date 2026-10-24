# COP31 canlı yayın ve mükerrerlik denetimi — 24 Ekim 2026

Canlı veri: https://events.cop31radar.com/cop31 sayfasının gömülü etkinlik listesi (`live_cop31_events_2026-10-24.json`). Karşılaştırılan dosya: `COP31_2026-10-24_site_import.csv`.

| Ölçü | Sayı |
| --- | ---: |
| Canlı sitede PUBLISHED | 442 |
| Hazırlanan içe aktarma satırı (hepsi DRAFT) | 688 |
| Canlıyla aynı slug | 0 |
| Canlıyla aynı normalize başlık + tarih | 0 |
| Canlıyla aynı normalize başlık (tarih farkından bağımsız) | 0 |
| Canlıyla aynı gün anlamlı başlık benzerliğiyle doğrulanan mükerrer | 0 |
| Yeni dosya içinde olası mükerrer çift | 2 |
| İki çift tek etkinlik sayılırsa yeni tekil etkinlik | 686 |

## Yeni dosyadaki iki çift

| Etkinlik | Tarih/saat (Antalya) | Belém slug | Mutirão slug | Bulgular |
| --- | --- | --- | --- | --- |
| Brazil Pavillion Opening | 9 Kasım 17:45–18:45 | `bra-2026-005` | `bra-2026-078` | Aynı başlık, saat ve düzenleyen; resmî program iki salonda listeliyor. |
| Pavilion Organizing Committee Solemn Session | 12 Kasım 17:45–18:45 | `bra-2026-029` | `bra-2026-102` | Aynı başlık, saat ve düzenleyen; resmî program iki salonda listeliyor. |

Kaynak: https://www.gov.br/mma/pt-br/noticias-defeso-eleitoral/check-out-the-schedule-of-events-at-the-brazil-pavilion-at-cop31

Başlık benzerliği aday taramasında aynı gün ve saat, başka tarihte yüksek benzerlik, kaynak ve mekân bilgileri birlikte değerlendirildi. İki salon satırının tek törenin eşzamanlı gösterimi olup olmadığı kaynakta açıkça belirtilmiyor; bu nedenle içe aktarma dosyasındaki 688 satır henüz otomatik olarak birleştirilmedi. Ayrı tarihte aynı başlıklı iki UN Pavilion oturumu farklı saat ve düzenleyenlere sahip olduğundan mükerrer sayılmadı.
