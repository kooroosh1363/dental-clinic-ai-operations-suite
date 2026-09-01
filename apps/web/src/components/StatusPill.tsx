export function StatusPill({ value }: { value: string }) {
  return (
    <span className={`pill pill-${value.toLowerCase().replaceAll("_", "-")}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
