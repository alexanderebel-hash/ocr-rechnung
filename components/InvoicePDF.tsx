import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: '48pt 16pt 32pt 21pt',
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  header: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    width: 60,
    height: 25,
  },
  companyInfoBlock: {
    fontSize: 8,
    color: '#666',
    textAlign: 'right',
  },
  senderLine: {
    fontSize: 8,
    color: '#666',
    marginBottom: 15,
  },
  addressBlock: {
    marginBottom: 20,
    fontSize: 10,
    lineHeight: 1.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaBox: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 15,
  },
  metaBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  klientBox: {
    padding: 10,
    backgroundColor: '#eff6ff',
    border: '1pt solid #dbeafe',
    borderRadius: 4,
    marginBottom: 15,
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#c7d2fe',
    padding: 6,
    fontSize: 9,
    fontStyle: 'italic',
    borderBottom: '1pt solid #e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1pt solid #e5e7eb',
    fontSize: 9,
  },
  col1: { width: '10%' },
  col2: { width: '40%' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#e5e7eb',
    marginTop: 5,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#c7d2fe',
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  hinweisBox: {
    backgroundColor: '#fef3c7',
    borderLeft: '3pt solid #f59e0b',
    padding: 8,
    marginTop: 15,
    marginBottom: 10,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 21,
    right: 16,
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
  subtleText: {
    fontSize: 7,
    color: '#666',
    fontStyle: 'italic',
  },
});

interface InvoicePosition {
  lkCode: string;
  bezeichnung: string;
  menge: number;
  preis: number;
  gesamt: number;
  bewilligt: boolean;
  istAUB?: boolean;
  notiz?: string;
}

interface InvoiceData {
  rechnungsnummer: string;
  rechnungsDatum: string;
  debitor: string;
  ik: string;
  zeitraumVon: string;
  zeitraumBis: string;
  klient: {
    name: string;
    adresse: string;
    pflegegrad: number;
  };
  dienst: {
    name: string;
    strasse: string;
    plz: string;
    ik: string;
    telefon: string;
    telefax: string;
    email: string;
  };
  positionen: InvoicePosition[];
  zwischensumme: number;
  zinv: number;
  gesamtbetrag: number;
  pflegekasse: number;
  rechnungsbetrag: number;
  zahlungsziel: string;
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.companyInfoBlock}>
            <Text style={styles.boldText}>{data.dienst.name}</Text>
            <Text>{data.dienst.strasse}</Text>
            <Text>{data.dienst.plz}</Text>
            <Text style={{ marginTop: 4 }}>IK: {data.dienst.ik}</Text>
          </View>
        </View>

        {/* Sender Line */}
        <View style={styles.senderLine}>
          <Text>{data.dienst.name}, {data.dienst.strasse}, {data.dienst.plz}</Text>
        </View>

        {/* Recipient Address */}
        <View style={styles.metaRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.boldText}>Bezirksamt Mitte von Berlin</Text>
            <Text>Standort Wedding</Text>
            <Text>Müllerstraße 146 - 147</Text>
            <Text>13344 Berlin</Text>
          </View>
          <View style={{ textAlign: 'right', fontSize: 10 }}>
            <Text>Telefon: {data.dienst.telefon}</Text>
            <Text>Telefax: {data.dienst.telefax}</Text>
            <Text>E-Mail: {data.dienst.email}</Text>
            <Text style={[styles.boldText, { marginTop: 4 }]}>Datum: Berlin, {data.rechnungsDatum}</Text>
          </View>
        </View>

        {/* Invoice Meta Box */}
        <View style={styles.metaBox}>
          <View style={styles.metaBoxRow}>
            <Text style={styles.boldText}>Rechnung Nr.: {data.rechnungsnummer}</Text>
            <Text style={styles.boldText}>IK: {data.ik}</Text>
          </View>
          <View style={styles.metaBoxRow}>
            <Text>Debitor: {data.debitor}</Text>
            <Text></Text>
          </View>
          <Text style={{ marginTop: 3 }}>
            Abrechnungszeitraum: {data.zeitraumVon} bis {data.zeitraumBis}
          </Text>
        </View>

        {/* Client Info Box */}
        <View style={styles.klientBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.boldText}>Leistungsempfänger:</Text>
              <Text style={[styles.boldText, { marginTop: 2 }]}>{data.klient.name}</Text>
              <Text>{data.klient.adresse}</Text>
            </View>
            <View>
              <Text style={styles.boldText}>Pflegegrad: {data.klient.pflegegrad}</Text>
              <Text style={{ marginTop: 4 }}>Leistungsgrundlage: SGB XI §36</Text>
            </View>
          </View>
        </View>

        {/* Invoice Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Abk.</Text>
            <Text style={styles.col2}>Leistung</Text>
            <Text style={styles.col3}>Anzahl</Text>
            <Text style={styles.col4}>Einzelpreis</Text>
            <Text style={styles.col5}>Gesamtpreis</Text>
          </View>

          {data.positionen.map((pos, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={styles.col1}>{pos.istAUB ? 'AUB' : pos.lkCode}</Text>
              <View style={styles.col2}>
                <Text>{pos.bezeichnung}</Text>
                {pos.notiz && (
                  <Text style={styles.subtleText}>{pos.notiz}</Text>
                )}
              </View>
              <Text style={styles.col3}>{pos.menge.toFixed(2)}</Text>
              <Text style={styles.col4}>{pos.preis.toFixed(2)}</Text>
              <Text style={[styles.col5, styles.boldText]}>{pos.gesamt.toFixed(2)}</Text>
            </View>
          ))}

          {/* Subtotals */}
          <View style={styles.totalRow}>
            <Text style={styles.boldText}>Zwischensumme:</Text>
            <Text style={styles.boldText}>{data.zwischensumme.toFixed(2)} EUR</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.col1}>ZINV</Text>
            <Text style={styles.col2}>Investitionskosten 3,38%</Text>
            <Text style={styles.col3}>1,00</Text>
            <Text style={styles.col4}>{data.zinv.toFixed(2)}</Text>
            <Text style={[styles.col5, styles.boldText]}>{data.zinv.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.boldText}>Gesamtbetrag:</Text>
            <Text style={styles.boldText}>{data.gesamtbetrag.toFixed(2)} EUR</Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: '#f9fafb' }]}>
            <Text style={[styles.col1, styles.col2, { width: '50%' }]}>./. Anteil Pflegekasse:</Text>
            <Text style={[styles.col3, styles.col4, styles.col5, { width: '50%', textAlign: 'right' }]}>
              {data.pflegekasse.toFixed(2)} EUR
            </Text>
          </View>

          <View style={styles.finalTotalRow}>
            <Text>Rechnungsbetrag:</Text>
            <Text>{data.rechnungsbetrag.toFixed(2)} EUR</Text>
          </View>
        </View>

        {/* Notice Box */}
        <View style={styles.hinweisBox}>
          <Text style={styles.boldText}>Hinweis:</Text>
          <Text style={{ marginTop: 3 }}>
            Positionen mit "erbracht, aktuell nicht bewilligt" wurden dokumentarisch aufgeführt,
            fließen jedoch nicht in die Rechnungssumme ein.
          </Text>
        </View>

        {/* Payment Terms */}
        <View style={{ marginTop: 8, fontSize: 10 }}>
          <Text>Zahlbar bis zum {data.zahlungsziel} ohne Abzug.</Text>
          <Text style={{ fontSize: 8, marginTop: 2 }}>Umsatzsteuerfrei gemäß § 4 Nr. 16 UStG</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.boldText}>Sitz der Gesellschaft: DomusVita Gesundheit GmbH • Waldemarstrasse 10 A • 10999 Berlin</Text>
          <Text>Telefon: 030/6120152-0 • Telefax: 030/6120152-10 • E-Mail: kreuzberg@domusvita.de • www.domusvita.de</Text>
          <Text>Geschäftsführer: Lukas Dahrendorf • Alexander Ebel</Text>
          <Text>Bankverbindung: DE53100500000190998890 • BIC: BELADEBEXXX • Berliner Sparkasse</Text>
          <Text>AG Berlin Charlottenburg • HRB 87436 B • Steuernummer: 29/582/51396</Text>
        </View>
      </Page>
    </Document>
  );
}
