export default function LegoBrick({ size = 30 }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.83)}
      viewBox="0 0 36 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 13 L32 7 L32 24 L24 30Z" fill="#8C0008"/>
      <path d="M0 13 L24 13 L32 7 L8 7Z" fill="#FF2E18"/>
      <rect x="0" y="13" width="24" height="17" fill="#E3000B"/>
      <rect x="0" y="26" width="24" height="4" fill="#C2000A"/>
      <rect x="0" y="13" width="3" height="17" fill="#CC000A"/>

      {/* Stud 1 */}
      <path d="M6.5 10 L6.5 6 L11.5 6 L11.5 10Z" fill="#FF3320"/>
      <ellipse cx="9" cy="10" rx="2.5" ry="1.05" fill="#BB0009"/>
      <ellipse cx="9" cy="6"  rx="2.5" ry="1.05" fill="#FF5540"/>

      {/* Stud 2 */}
      <path d="M18.5 10 L18.5 6 L23.5 6 L23.5 10Z" fill="#FF3320"/>
      <ellipse cx="21" cy="10" rx="2.5" ry="1.05" fill="#BB0009"/>
      <ellipse cx="21" cy="6"  rx="2.5" ry="1.05" fill="#FF5540"/>
    </svg>
  )
}
