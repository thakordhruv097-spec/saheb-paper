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

  /* ── Shared cell style for the 6-pill spec grid ── */
  const pillStyle: React.CSSProperties = {
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    padding: '7px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
  };

  return (
    <div
      id={id}
      className={`bg-white text-black select-none print:m-0 print:shadow-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '376px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
        boxSizing: 'border-box',
        border: 'none',
        borderRadius: '20px',
        padding: '18px 16px 20px 16px',
        backgroundColor: '#ffffff',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ───── 1. TOP HEADER / CLEARANCE ZONE ───── */}
      <div
        style={{
          minHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '10px',
        }}
      >
        {header || null}
      </div>

      {/* Top Hairline Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: '#e2e8f0',
          width: '100%',
          marginBottom: '14px',
        }}
      />

      {/* ───── 2. SPEC PILL GRID ───── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {/* Row 1: GSM, WIDTH, WEIGHT */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px',
          }}
        >
          <div style={pillStyle}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>GSM</div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gsm || '---'}</div>
          </div>
          <div style={pillStyle}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>WIDTH</div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{width || '---'}</div>
          </div>
          <div style={pillStyle}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>WEIGHT</div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{weight || '---'}</div>
          </div>
        </div>

        {/* Row 2: DIA, PLY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '8px',
          }}
        >
          <div style={pillStyle}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>DIA</div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dia || '---'}</div>
          </div>
          <div style={pillStyle}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>PLY</div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ply || '---'}</div>
          </div>
        </div>
      </div>

      {/* ───── 3. DETAIL TABLE (ROUNDED EDGES) ───── */}
      <div
        style={{
          width: '100%',
          border: '1.5px solid #cbd5e1',
          borderRadius: '13px',
          overflow: 'hidden',
          marginBottom: '12px',
          backgroundColor: '#ffffff',
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
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ width: '35%', padding: '7px 12px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                QUALITY
              </td>
              <td style={{ padding: '7px 12px', verticalAlign: 'middle', wordBreak: 'break-word', lineHeight: 1.25 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {quality || '---'}
                </div>
                {customDescription ? (
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginTop: '2px', lineHeight: 1.2 }}>
                    {customDescription}
                  </div>
                ) : null}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '7px 12px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                ROLL NO.
              </td>
              <td style={{ padding: '7px 12px', fontSize: '14px', fontWeight: 900, color: '#0f172a', verticalAlign: 'middle' }}>
                {rollNo || '---'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ───── 4. ENCLOSED QR CODE & REEL NO. CARD ───── */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          boxSizing: 'border-box',
        }}
      >
        {/* QR Code in white crisp bezel */}
        <div
          style={{
            flexShrink: 0,
            padding: '5px',
            border: '1px solid #cbd5e1',
            borderRadius: '9px',
            backgroundColor: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '94px',
            height: '94px',
            boxSizing: 'border-box',
          }}
        >
          {finalQrValue ? (
            <QRCodeSVG
              value={finalQrValue}
              size={84}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          ) : (
            <div
              style={{
                width: '84px',
                height: '84px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '6px',
                color: '#94a3b8',
                fontSize: '8px',
                fontWeight: 700,
                textAlign: 'center',
                padding: '4px',
              }}
            >
              <span>NO REEL</span>
              <span style={{ fontSize: '7px', marginTop: '2px' }}>PENDING QR</span>
            </div>
          )}
        </div>

        {/* Reel metadata & Complaint return clause */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1px' }}>
            REEL IDENTIFIER / QR CODE
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            REEL NO.
          </div>
          <div
            style={{
              fontSize: '25px',
              fontWeight: 900,
              color: reelNo ? '#0f172a' : '#94a3b8',
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

          {/* Thin divider line below reel number */}
          <div style={{ height: '1px', backgroundColor: '#cbd5e1', width: '100%', margin: '5px 0 4px 0' }} />

          <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600, lineHeight: 1.25 }}>
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

      {/* Bottom Hairline Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: '#e2e8f0',
          width: '100%',
          marginTop: '6px',
          marginBottom: '34px',
        }}
      />

      {/* ───── 5. MADE IN INDIA ───── */}
      <div
        style={{
          textAlign: 'center',
          paddingBottom: '8px',
          pageBreakBefore: 'avoid',
          breakBefore: 'avoid',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '3px',
            color: '#475569',
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
