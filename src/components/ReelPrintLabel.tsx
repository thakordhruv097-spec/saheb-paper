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

  /** Product / Quality description - e.g. 'Soft Tissue Napkin, Premium 2Ply' */
  product?: string;
  quality?: string;
  /** Additional Description / Custom Text - e.g. 'Premium 2Ply - Light Tinted' */
  customDescription?: string;
  /** Shade / Color - e.g. 'Light Tinted' */
  shade?: string;
  /** Roll number - e.g. '14732' (Optional) */
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
 * 100% Pure Black & White Thermal / Industrial Reel Label
 * Specifically engineered for TSC TTP-244 Pro & 203 DPI thermal barcode printers.
 * - STRICT Monochrome: Only Pure Black (#000000) on Pure White (#ffffff).
 * - Solid ~0.4mm (1.5px/1.5pt) pure black box borders that guarantee physical visibility.
 * - Zero gradients, zero shadows, zero opacity, zero gray colors.
 */
export const ReelPrintLabel: React.FC<ReelPrintLabelProps> = ({
  gsm = '',
  width = '',
  weight = '',
  dia = '',
  core = '',
  ply = '',
  quality = '',
  product = '',
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
  const displayProduct = product || quality;

  /* ── Shared cell style for the 5 individual spec boxes (Pure White BG + Solid 1.5px Pure Black Border) ── */
  const specBoxStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1.5px solid #000000',
    borderRadius: '6px',
    padding: '7px 8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  return (
    <div
      id={id}
      className={`reel-thermal-label bg-white text-black select-none print:m-0 print:shadow-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '380px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
        boxSizing: 'border-box',
        border: 'none',
        borderRadius: '0px',
        padding: '20px 14px 14px 14px', // Extra blank space at the top
        backgroundColor: '#ffffff',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        boxShadow: 'none',
      }}
    >
      {/* Thermal Print Enforcement Stylesheet */}
      <style>{`
        @media print {
          #${id}, .reel-thermal-label {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #${id} *, .reel-thermal-label * {
            color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #${id} .spec-box, .reel-thermal-label .spec-box {
            border: 1.5px solid #000000 !important;
            background-color: #ffffff !important;
          }
          #${id} .solid-black-divider, .reel-thermal-label .solid-black-divider {
            background-color: #000000 !important;
            height: 1.5px !important;
          }
        }
      `}</style>

      {/* ───── 1. TOP HEADER / CLEARANCE ZONE (Extra Blank Space at Top) ───── */}
      <div
        style={{
          minHeight: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        {header || null}
      </div>

      {/* Top Solid Pure Black Divider */}
      <div
        className="solid-black-divider"
        style={{
          height: '1.5px',
          backgroundColor: '#000000',
          width: '100%',
          marginBottom: '10px',
        }}
      />

      {/* ───── 2. SPECIFICATION BOXES (SOLID PURE BLACK BORDERS) ───── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
        {/* Row 1: GSM, WIDTH, WEIGHT */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px',
          }}
        >
          {/* GSM BOX */}
          <div className="spec-box" style={specBoxStyle}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
              GSM
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#000000', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {gsm || '---'}
            </div>
          </div>

          {/* WIDTH BOX */}
          <div className="spec-box" style={specBoxStyle}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
              WIDTH
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#000000', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {width || '---'}
            </div>
          </div>

          {/* WEIGHT BOX */}
          <div className="spec-box" style={specBoxStyle}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
              WEIGHT
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#000000', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {weight || '---'}
            </div>
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
          {/* DIA BOX */}
          <div className="spec-box" style={specBoxStyle}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
              DIA
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#000000', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dia || '---'}
            </div>
          </div>

          {/* PLY BOX */}
          <div className="spec-box" style={specBoxStyle}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
              PLY
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#000000', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ply || '---'}
            </div>
          </div>
        </div>
      </div>

      {/* ───── 3. PRODUCT SPECIFICATION BOX (SOLID PURE BLACK BORDER) ───── */}
      <div
        className="spec-box"
        style={{
          width: '100%',
          border: '1.5px solid #000000',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '10px',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
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
            <tr>
              <td
                style={{
                  width: '32%',
                  padding: '7px 10px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#000000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  borderRight: '1.5px solid #000000',
                  verticalAlign: 'middle',
                }}
              >
                PRODUCT
              </td>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', wordBreak: 'break-word', lineHeight: 1.25 }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#000000' }}>
                  {displayProduct || '---'}
                </div>
                {customDescription ? (
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#000000', marginTop: '2px', lineHeight: 1.2 }}>
                    {customDescription}
                  </div>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ───── 4. QR CODE & REEL IDENTIFIER SECTION (SOLID PURE BLACK BORDER) ───── */}
      <div
        className="spec-box"
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1.5px solid #000000',
          borderRadius: '6px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          boxSizing: 'border-box',
        }}
      >
        {/* QR Code in Solid Pure Black Bezel Frame */}
        <div
          style={{
            flexShrink: 0,
            padding: '4px',
            border: '1.5px solid #000000',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '92px',
            height: '92px',
            boxSizing: 'border-box',
          }}
        >
          {finalQrValue ? (
            <QRCodeSVG
              value={finalQrValue}
              size={82}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          ) : (
            <div
              style={{
                width: '82px',
                height: '82px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                border: '1.5px dashed #000000',
                borderRadius: '4px',
                color: '#000000',
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

        {/* Reel Metadata & Complaint Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1px' }}>
            REEL IDENTIFIER / QR CODE
          </div>
          <div style={{ fontSize: '9px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            REEL NO.
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#000000',
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
        </div>
      </div>

      {/* Optional Custom Footer slot if passed */}
      {footer ? (
        <div style={{ minHeight: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '6px' }}>
          {footer}
        </div>
      ) : null}

      {/* Bottom Solid Pure Black Divider */}
      <div
        className="solid-black-divider"
        style={{
          height: '1.5px',
          backgroundColor: '#000000',
          width: '100%',
          marginTop: '4px',
          marginBottom: '16px',
        }}
      />

      {/* ───── 5. MADE IN INDIA (SOLID PURE BLACK) ───── */}
      <div
        style={{
          textAlign: 'center',
          paddingBottom: '4px',
          pageBreakBefore: 'avoid',
          breakBefore: 'avoid',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '3px',
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
