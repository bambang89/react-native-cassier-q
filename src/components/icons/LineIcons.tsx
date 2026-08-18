import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Set ikon garis (outline, 24x24, stroke bulat) diambil langsung dari markup SVG
// di cassier-q-webapp (tablet-pos.html, components.html) — dipakai di sidebar,
// header, dan panel kasir supaya konsisten dengan sumber desain resminya.
export interface LineIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const DEFAULT_SIZE = 20;
const DEFAULT_STROKE = 1.7;

function Base({
  size = DEFAULT_SIZE,
  color = 'currentColor',
  strokeWidth = DEFAULT_STROKE,
  children,
}: LineIconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function DashboardIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Rect x={3} y={3} width={7} height={7} rx={1.5} />
      <Rect x={14} y={3} width={7} height={7} rx={1.5} />
      <Rect x={3} y={14} width={7} height={7} rx={1.5} />
      <Rect x={14} y={14} width={7} height={7} rx={1.5} />
    </Base>
  );
}

export function CartIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={9} cy={20} r={1.3} fill={props.color ?? 'currentColor'} stroke="none" />
      <Circle cx={18} cy={20} r={1.3} fill={props.color ?? 'currentColor'} stroke="none" />
      <Path d="M2 3h2.4l2.1 11.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7.5H6" />
    </Base>
  );
}

export function ReceiptIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M6 2h12v19l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.3V2Z" />
      <Path d="M9 7h6M9 11h6M9 15h3" />
    </Base>
  );
}

export function ClipboardIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Rect x={5} y={4} width={14} height={17} rx={2} />
      <Rect x={9} y={2} width={6} height={4} rx={1} />
      <Path d="M9 11h6M9 15h6M9 19h3" />
    </Base>
  );
}

export function BoxIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M12 3 3 7.5 12 12l9-4.5Z" />
      <Path d="M3 7.5v9L12 21l9-4.5v-9" />
      <Path d="M12 12v9" />
    </Base>
  );
}

export function LayersIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M12 3 2.5 8 12 13l9.5-5Z" />
      <Path d="M2.5 12 12 17l9.5-5" />
      <Path d="M2.5 16 12 21l9.5-5" />
    </Base>
  );
}

export function PeopleIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={9} cy={8} r={3.4} />
      <Path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <Path d="M16.2 3.2a3.4 3.4 0 0 1 0 6.6" />
      <Path d="M17.5 14.2c2.6.6 4 2.7 4 5.8" />
    </Base>
  );
}

export function BarChartIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M5 20V10M12 20V4M19 20v-7" />
    </Base>
  );
}

export function EmployeeIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={9} r={4} />
      <Path d="M8 12.5 6 21l6-3 6 3-2-8.5" />
    </Base>
  );
}

export function StoreIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M3 9.5 4.5 3h15L21 9.5" />
      <Path d="M3 9.5a2.7 2.7 0 0 0 5.2 1 2.7 2.7 0 0 0 5.2 0 2.7 2.7 0 0 0 5.2 0 2.7 2.7 0 0 0 5.2-1" />
      <Path d="M5 11v10h14V11" />
      <Path d="M10 21v-6h4v6" />
    </Base>
  );
}

export function PlugIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M9 3v5M15 3v5M6 8h12l-1 5a5 5 0 0 1-10 0Z" />
      <Path d="M12 16v5" />
    </Base>
  );
}

export function SettingsIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Base>
  );
}

export function HelpIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9.3} />
      <Path d="M9.2 9.3a2.8 2.8 0 1 1 4 2.5c-.9.5-1.4 1-1.4 2.1" />
      <Circle cx={12} cy={17.2} r={0.15} fill={props.color ?? 'currentColor'} stroke={props.color ?? 'currentColor'} strokeWidth={2} />
    </Base>
  );
}

export function SearchIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={11} cy={11} r={7.2} />
      <Path d="M21 21l-4.4-4.4" />
    </Base>
  );
}

export function BarcodeIcon(props: LineIconProps) {
  return (
    <Base {...props} strokeWidth={props.strokeWidth ?? 1.6}>
      <Path d="M3 4v16M7 4v16M10 4v16M15 4v16M17.5 4v16M21 4v16" />
    </Base>
  );
}

export function BellIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
      <Path d="M10 19.5a2 2 0 0 0 4 0" />
    </Base>
  );
}

export function ChevronDownIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M6 9l6 6 6-6" />
    </Base>
  );
}

export function ClockIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9.3} />
      <Path d="M12 7v5.3l3.5 2" />
    </Base>
  );
}

export function DiscountIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Circle cx={7} cy={7} r={2.5} />
      <Circle cx={17} cy={17} r={2.5} />
      <Path d="M18.5 5.5 5.5 18.5" />
    </Base>
  );
}

export function NoteIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M5 3h11l3 3v15H5Z" />
      <Path d="M16 3v3h3" />
      <Path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h4" />
    </Base>
  );
}

export function TrashIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M4 7h16" />
      <Path d="M9 7V4h6v3" />
      <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <Path d="M10 11v6M14 11v6" />
    </Base>
  );
}

export function RegisterIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Rect x={2} y={6} width={20} height={12.5} rx={2} />
      <Circle cx={12} cy={12.3} r={3} />
      <Path d="M5.5 9v0M18.5 15.6v0" />
    </Base>
  );
}

export function TrendUpIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M12 19V5" />
      <Path d="M6 11l6-6 6 6" />
    </Base>
  );
}

export function TrendDownIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M12 5v14" />
      <Path d="M6 13l6 6 6-6" />
    </Base>
  );
}

export function TrendingIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M3 17l6-6 4 4 8-9" />
      <Path d="M15 6h6v6" />
    </Base>
  );
}

export function LightbulbIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M12 2s5 4.5 5 9.5a5 5 0 0 1-10 0c0-1 .3-2 1-3 .3 1 1 1.5 1.5 1.5-1-3 1-5.5 2.5-8Z" />
    </Base>
  );
}

export function PlusIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function FilterIcon(props: LineIconProps) {
  return (
    <Base {...props}>
      <Path d="M4 5h16l-6.5 8v6l-3 1.5v-7.5Z" />
    </Base>
  );
}
