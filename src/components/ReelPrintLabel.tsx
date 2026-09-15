import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface ReelPrintLabelProps {
  /** GSM value - e.g. '17' */
  gsm?: string | number;
  /** Width with unit - e.g. '23 CM' */
  width?: string;
  /** Weight with unit - e.g. '51 KG' */
  weight?: string;
  /** Diameter with unit - e.g. '91 CM' */
  dia?: string;
  /** Core size - e.g. '3"' */
  core?: string;
  /** Ply count - e.g. '2 Ply' */
  ply?: string;

  /** Quality / Grade description - e.g. 'Soft Tissue Napkin, Premium 2Ply' */
  quality?: string;
  /** Additional Description / Custom Text - e.g. 'Premium 2Ply - Light Tinted' */
  customDescription?: string;
  /** Shade / Color - e.g. 'Light Tinted' */
  shade?: string;
  /** Roll number - e.g. '14732' */
  rollNo?: string | number;
  /** Number of joints - e.g. 'Nill' or '0' */
  jointCount?: string | number;

  /** Reel identifier - e.g. 'RNA152906' */
  reelNo?: string;
  /** Custom QR payload. If omitted, defaults to reelNo */
  qrValue?: string;

  /** Injected header block (e.g. logo, tagline) */
  header?: React.ReactNode;
  /** Injected footer block (e.g. company contact info) */
  footer?: React.ReactNode;

  /** Show dashed placeholder frames when header/footer are empty */
  showPlaceholders?: boolean;

  /** Extra class names */
  className?: string;
  /** DOM id */
  id?: string;
}

/**
 * Print-ready industrial reel/QR label.
 * Portrait ~400×620px, thermal/inkjet safe (no solid fills, white bg, hairline borders).
 */
export const ReelPrintLabel: React.FC<ReelPrintLabelProps> = ({
  gsm = '',
  width = '',
  weight = '',
  dia = '',
  core = '',
  ply = '',
  quality = '',
  customDescription,
  shade = '',
  rollNo = '',
  jointCount = '',
  reelNo = '',
  qrValue,
  header,
  footer,
  showPlaceholders = false,
  className = '',
  id = 'reel-print-label',
}) => {
  const finalQrValue = String(qrValue || reelNo || '').trim();

  return (
    <div
      id={id}
      className={`bg-white text-black select-none print:m-0 print:shadow-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '380px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
        boxSizing: 'border-box',
        border: 'none',
        padding: '16px 14px 14px 14px',
        backgroundColor: '#ffffff',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '520px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ───── 1. OPTIONAL HEADER ───── */}
      {header ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            marginBottom: '10px',
            borderBottom: '2px solid #000000',
            paddingBottom: '8px',
          }}
        >
          {header}
        </div>
      ) : null}

      {/* ───── 2. SPEC NUMBERS (ROW 1: GSM, WIDTH, WEIGHT) ───── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          paddingBottom: '10px',
          borderBottom: '1.5px solid #000000',
          marginBottom: '10px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
            GSM
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#000000', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {gsm || '---'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
            WIDTH
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#000000', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {width || '---'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
            WEIGHT
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#000000', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {weight || '---'}
          </div>
        </div>
      </div>

      {/* ───── 3. SPEC NUMBERS (ROW 2: DIA, PLY) ───── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '12px',
          paddingBottom: '10px',
          borderBottom: '1.5px solid #000000',
          marginBottom: '10px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
            DIA
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#000000', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dia || '---'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
            PLY
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#000000', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ply || '---'}
          </div>
        </div>
      </div>

      {/* ───── 4. QUALITY & ROLL NO ───── */}
      <div
        style={{
          width: '100%',
          borderBottom: '1.5px solid #000000',
          paddingBottom: '10px',
          marginBottom: '12px',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: 0,
            tableLayout: 'fixed',
          }}
        >
          <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ width: '30%', padding: '6px 0', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', verticalAlign: 'middle' }}>
                QUALITY
              </td>
              <td style={{ padding: '6px 0 6px 12px', verticalAlign: 'middle', wordBreak: 'break-word', lineHeight: 1.2 }}>
                <div style={{ fontSize: '19px', fontWeight: 900, color: '#000000' }}>
                  {quality || '---'}
                </div>
                {customDescription ? (
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginTop: '2px', lineHeight: 1.2 }}>
                    {customDescription}
                  </div>
                ) : null}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.6px', verticalAlign: 'middle' }}>
                ROLL NO.
              </td>
              <td style={{ padding: '6px 0 6px 12px', fontSize: '22px', fontWeight: 900, color: '#000000', verticalAlign: 'middle', fontFamily: 'monospace' }}>
                {rollNo || '---'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ───── 5. QR CODE & REEL NO SECTION ───── */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingBottom: '12px',
          borderBottom: '1.5px solid #000000',
          marginBottom: '10px',
          boxSizing: 'border-box',
        }}
      >
        {/* QR Code */}
        <div
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '96px',
            height: '96px',
            boxSizing: 'border-box',
          }}
        >
          {finalQrValue ? (
            <QRCodeSVG
              value={finalQrValue}
              size={96}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          ) : (
            <div
              style={{
                width: '96px',
                height: '96px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                border: '1.5px dashed #000000',
                borderRadius: '6px',
                color: '#64748b',
                fontSize: '9px',
                fontWeight: 800,
                textAlign: 'center',
                padding: '4px',
              }}
            >
              <span>NO REEL</span>
              <span style={{ fontSize: '8px', marginTop: '2px' }}>PENDING QR</span>
            </div>
          )}
        </div>

        {/* Reel metadata & return clause */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1px' }}>
            REEL IDENTIFIER / QR CODE
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            REEL NO.
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: reelNo ? '#000000' : '#94a3b8',
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              marginTop: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {reelNo || '---'}
          </div>

          <div style={{ height: '1px', backgroundColor: '#000000', width: '100%', margin: '6px 0 5px 0' }} />

          <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600, lineHeight: 1.25 }}>
            Please return back this label<br />in case of any complaint
          </div>
        </div>
      </div>

      {/* Optional Custom Footer slot if passed */}
      {footer ? (
        <div style={{ minHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '8px' }}>
          {footer}
        </div>
      ) : null}

      {/* ───── 6. MADE IN INDIA (PINNED TO BOTTOM) ───── */}
      <div
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          paddingTop: '8px',
          paddingBottom: '4px',
          pageBreakBefore: 'avoid',
          breakBefore: 'avoid',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#000000',
            textTransform: 'uppercase',
            display: 'inline-block',
          }}
        >
          MADE IN INDIA
        </span>
      </div>
    </div>
  );
};

export default ReelPrintLabel;
