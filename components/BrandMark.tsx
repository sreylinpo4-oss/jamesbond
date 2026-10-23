export default function BrandMark({
  className = "brand-mark",
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ display: "block" }}
      >
        <circle cx="12" cy="12" r="2.2" />
        <path d="M12 2.5C10.8 5 10.8 7.5 12 9.5C13.2 7.5 13.2 5 12 2.5Z" />
        <path d="M12 21.5C10.8 19 10.8 16.5 12 14.5C13.2 16.5 13.2 19 12 21.5Z" />
        <path d="M2.5 12C5 10.8 7.5 10.8 9.5 12C7.5 13.2 5 13.2 2.5 12Z" />
        <path d="M21.5 12C19 10.8 16.5 10.8 14.5 12C16.5 13.2 19 13.2 21.5 12Z" />
        <path d="M5.28 5.28C7.1 6.5 8.9 7.7 10.2 10.2C7.7 8.9 6.5 7.1 5.28 5.28Z" />
        <path d="M18.72 18.72C16.9 17.5 15.1 16.3 13.8 13.8C16.3 15.1 17.5 16.9 18.72 18.72Z" />
        <path d="M5.28 18.72C6.5 16.9 7.7 15.1 10.2 13.8C8.9 16.3 7.1 17.5 5.28 18.72Z" />
        <path d="M18.72 5.28C17.5 7.1 16.3 8.9 13.8 10.2C15.1 7.7 16.9 6.5 18.72 5.28Z" />
      </svg>
    </span>
  );
}
