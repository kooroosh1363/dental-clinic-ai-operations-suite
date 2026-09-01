export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <span>+</span>
      </div>
      {!compact && (
        <div>
          <strong>NovaSmile</strong>
          <small>Clinic operations</small>
        </div>
      )}
    </div>
  );
}
