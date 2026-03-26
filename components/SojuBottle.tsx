export default function SojuBottle() {
  return (
    <svg
      viewBox="0 0 240 500"
      className="w-48 sm:w-56 md:w-64 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bottle - single smooth path, chubby whiskey shape */}
      <path
        d="
          M104 8
          Q104 2 110 2 L130 2 Q136 2 136 8
          L136 20
          Q136 24 133 24 L107 24 Q104 24 104 20
          Z
        "
        fill="#1A1A1A"
      />
      <path
        d="
          M107 24
          L107 80
          Q107 100 100 115
          Q80 145 52 170
          Q38 185 38 210
          L38 430
          Q38 458 60 458
          L180 458
          Q202 458 202 430
          L202 210
          Q202 185 188 170
          Q160 145 140 115
          Q133 100 133 80
          L133 24
        "
        fill="#D4B8E0"
      />

      {/* Label background */}
      <rect x="48" y="220" width="144" height="190" rx="6" fill="#E8652E" />

      {/* Polka dots on label */}
      <circle cx="80" cy="250" r="14" fill="#6B7FD7" />
      <circle cx="155" cy="270" r="11" fill="#6B7FD7" />
      <circle cx="70" cy="310" r="16" fill="#6B7FD7" />
      <circle cx="165" cy="340" r="12" fill="#6B7FD7" />
      <circle cx="110" cy="375" r="14" fill="#6B7FD7" />
      <circle cx="150" cy="390" r="9" fill="#6B7FD7" />

      {/* Label text */}
      <text
        x="120"
        y="310"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="13"
        fontWeight="bold"
        fontFamily="serif"
      >
        {"women's place"}
      </text>
    </svg>
  );
}
