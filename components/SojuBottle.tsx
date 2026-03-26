export default function SojuBottle() {
  return (
    <svg
      viewBox="0 0 200 500"
      className="w-48 sm:w-56 md:w-64 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bottle cap */}
      <rect x="80" y="0" width="40" height="20" rx="4" fill="#1A1A1A" />

      {/* Bottle neck */}
      <rect x="85" y="20" width="30" height="80" rx="6" fill="#D4B8E0" />

      {/* Bottle neck taper */}
      <path
        d="M85 100 Q85 130 60 150 L60 150 L140 150 Q115 130 115 100 Z"
        fill="#D4B8E0"
      />

      {/* Bottle body */}
      <rect x="60" y="150" width="80" height="300" rx="8" fill="#D4B8E0" />

      {/* Bottle bottom */}
      <rect x="60" y="440" width="80" height="10" rx="4" fill="#B89CC8" />

      {/* Label background */}
      <rect x="65" y="200" width="70" height="180" rx="4" fill="#E8652E" />

      {/* Polka dots on label */}
      <circle cx="85" cy="225" r="10" fill="#6B7FD7" />
      <circle cx="115" cy="250" r="8" fill="#6B7FD7" />
      <circle cx="80" cy="280" r="12" fill="#6B7FD7" />
      <circle cx="120" cy="310" r="9" fill="#6B7FD7" />
      <circle cx="95" cy="345" r="11" fill="#6B7FD7" />

      {/* Label text */}
      <text
        x="100"
        y="270"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="9"
        fontWeight="bold"
        fontFamily="serif"
      >
        watchaladys
      </text>
    </svg>
  );
}
