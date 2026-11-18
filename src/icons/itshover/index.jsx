import React, { forwardRef } from "react";

// Official itshover repository icons
import AlarmClockPlusIcon from "./alarm-clock-plus-icon";
import AlignCenterIcon from "./align-center-icon";
import ArrowBackUpIcon from "./arrow-back-up-icon";
import ArrowBigRightDashIcon from "./arrow-big-right-dash-icon";
import ArrowNarrowLeftIcon from "./arrow-narrow-left-icon";
import ArrowNarrowRightIcon from "./arrow-narrow-right-icon";
import BookmarkIcon from "./bookmark-icon";
import BrainCircuitIcon from "./brain-circuit-icon";
import BrightnessDownIcon from "./brightness-down-icon";
import BulbSvg from "./bulb-svg";
import CameraIcon from "./camera-icon";
import CartIcon from "./cart-icon";
import ChartBarIcon from "./chart-bar-icon";
import ChartHistogramIcon from "./chart-histogram-icon";
import ChartLineIcon from "./chart-line-icon";
import ChartPieIcon from "./chart-pie-icon";
import CheckedIcon from "./checked-icon";
import ClockIcon from "./clock-icon";
import CreditCardRaw from "./credit-card";
import CurrencyDollarIcon from "./currency-dollar-icon";
import DotsHorizontalIcon from "./dots-horizontal-icon";
import DotsVerticalIcon from "./dots-vertical-icon";
import DoubleCheckIcon from "./double-check-icon";
import DownChevron from "./down-chevron";
import DownloadIcon from "./download-icon";
import ExternalLinkIcon from "./external-link-icon";
import EyeIcon from "./eye-icon";
import EyeOffIcon from "./eye-off-icon";
import FileDescriptionIcon from "./file-description-icon";
import FilledBellIcon from "./filled-bell-icon";
import FilledCheckedIcon from "./filled-checked-icon";
import FilterIcon from "./filter-icon";
import GearIcon from "./gear-icon";
import GlobeIcon from "./globe-icon";
import HashtagIcon from "./hashtag-icon";
import HistoryCircleIcon from "./history-circle-icon";
import HomeIcon from "./home-icon";
import InfoCircleIcon from "./info-circle-icon";
import LayersIcon from "./layers-icon";
import LayoutDashboardIcon from "./layout-dashboard-icon";
import LinkIcon from "./link-icon";
import LockIcon from "./lock-icon";
import LogoutIcon from "./logout-icon";
import MagnifierIcon from "./magnifier-icon";
import MapPinIcon from "./map-pin-icon";
import MessageCircleIcon from "./message-circle-icon";
import MoonIcon from "./moon-icon";
import PartyPopperIcon from "./party-popper-icon";
import PenIcon from "./pen-icon";
import QrCodeIcon from "./qrcode-icon";
import RefreshIcon from "./refresh-icon";
import RightChevron from "./right-chevron";
import RocketIcon from "./rocket-icon";
import RosetteDiscountCheckIcon from "./rosette-discount-check-icon";
import RosetteDiscountIcon from "./rosette-discount-icon";
import SaveIcon from "./save-icon";
import SendHorizontalIcon from "./send-horizontal-icon";
import SendIcon from "./send-icon";
import ShieldCheckRaw from "./shield-check";
import ShoppingCartIcon from "./shopping-cart-icon";
import SimpleCheckedIcon from "./simple-checked-icon";
import SlidersHorizontalIcon from "./sliders-horizontal-icon";
import SparklesIcon from "./sparkles-icon";
import Stack3Icon from "./stack-3-icon";
import StackIcon from "./stack-icon";
import StarIcon from "./star-icon";
import TargetIcon from "./target-icon";
import TelephoneIcon from "./telephone-icon";
import TrashIcon from "./trash-icon";
import TravelBag from "./travel-bag";
import TriangleAlertIcon from "./triangle-alert-icon";
import TrophyIcon from "./trophy-icon";
import UnorderedListIcon from "./unordered-list-icon";
import UploadIcon from "./upload-icon";
import UserCheckIcon from "./user-check-icon";
import UserIcon from "./user-icon";
import UsersIcon from "./users-icon";
import Volume2Icon from "./volume-2-icon";
import WalletIcon from "./wallet-icon";
import WhatsappIconRaw from "./whatsapp-icon";
import XIcon from "./x-icon";

// Custom itshover-animated icons for POS-Gallardo domain
import {
  ActivityIcon,
  ArmchairIcon,
  ArrowDownRightIcon,
  ArrowLeftRightIcon,
  ArrowUpDownIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  BikeIcon,
  CalculatorIcon,
  CalendarIcon,
  CarIcon,
  LeftChevronIcon,
  Loader2Icon,
  MinusCircleIcon,
  MinusIcon,
  PackageIcon,
  PackagePlusIcon,
  PlusCircleIcon,
  PlusIcon,
  PrinterIcon,
  StoreIcon,
  UpChevronIcon,
  WrenchIcon,
} from "./custom-icons";

const TAILWIND_SIZE_MAP = {
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "4.5": 18,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "12": 48,
  "14": 56,
  "16": 64,
};

function inferSizeFromClassName(className = "") {
  if (!className || typeof className !== "string") return 24;
  const match = className.match(/\b(?:w|h)-(\d+(?:\.\d+)?)\b/);
  if (match && TAILWIND_SIZE_MAP[match[1]]) {
    return TAILWIND_SIZE_MAP[match[1]];
  }
  const pxMatch = className.match(/\b(?:w|h)-\[(\d+)px\]/);
  if (pxMatch) {
    return Number(pxMatch[1]);
  }
  return 24;
}

function withItsHover(BaseComponent, displayName) {
  const Wrapped = forwardRef(
    (
      {
        size,
        color = "currentColor",
        strokeWidth = 2,
        className = "",
        style,
        onClick,
        title,
        id,
        ...rest
      },
      ref
    ) => {
      const resolvedSize = size !== undefined ? size : inferSizeFromClassName(className);
      const resolvedColor = (style && style.color) ? style.color : color;

      return (
        <span
          id={id}
          title={title}
          onClick={onClick}
          className={className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: resolvedSize,
            height: resolvedSize,
            flexShrink: 0,
            lineHeight: 0,
            ...style,
          }}
        >
          <BaseComponent
            ref={ref}
            size={resolvedSize}
            color={resolvedColor}
            strokeWidth={strokeWidth}
            className=""
            {...rest}
          />
        </span>
      );
    }
  );
  Wrapped.displayName = displayName || BaseComponent.displayName || "ItsHoverIcon";
  return Wrapped;
}

// Export all 110 icons used across POS-Gallardo + bonus itshover icons
export const Activity = withItsHover(ActivityIcon, "Activity");
export const AlertCircle = withItsHover(InfoCircleIcon, "AlertCircle");
export const AlertTriangle = withItsHover(TriangleAlertIcon, "AlertTriangle");
export const Archive = withItsHover(StackIcon, "Archive");
export const Armchair = withItsHover(ArmchairIcon, "Armchair");
export const ArrowDownRight = withItsHover(ArrowDownRightIcon, "ArrowDownRight");
export const ArrowLeft = withItsHover(ArrowNarrowLeftIcon, "ArrowLeft");
export const ArrowLeftRight = withItsHover(ArrowLeftRightIcon, "ArrowLeftRight");
export const ArrowRight = withItsHover(ArrowNarrowRightIcon, "ArrowRight");
export const ArrowUpDown = withItsHover(ArrowUpDownIcon, "ArrowUpDown");
export const ArrowUpRight = withItsHover(ArrowUpRightIcon, "ArrowUpRight");
export const Award = withItsHover(RosetteDiscountCheckIcon, "Award");
export const Banknote = withItsHover(BanknoteIcon, "Banknote");
export const Bell = withItsHover(FilledBellIcon, "Bell");
export const Bike = withItsHover(BikeIcon, "Bike");
export const Bot = withItsHover(BrainCircuitIcon, "Bot");
export const Box = withItsHover(LayersIcon, "Box");
export const Calculator = withItsHover(CalculatorIcon, "Calculator");
export const Calendar = withItsHover(CalendarIcon, "Calendar");
export const CalendarClock = withItsHover(AlarmClockPlusIcon, "CalendarClock");
export const CalendarDays = withItsHover(CalendarIcon, "CalendarDays");
export const CalendarRange = withItsHover(CalendarIcon, "CalendarRange");
export const Car = withItsHover(CarIcon, "Car");
export const CarFront = withItsHover(CarIcon, "CarFront");
export const Check = withItsHover(SimpleCheckedIcon, "Check");
export const CheckCircle = withItsHover(CheckedIcon, "CheckCircle");
export const CheckCircle2 = withItsHover(FilledCheckedIcon, "CheckCircle2");
export const CheckSquare = withItsHover(DoubleCheckIcon, "CheckSquare");
export const ChevronDown = withItsHover(DownChevron, "ChevronDown");
export const ChevronLeft = withItsHover(LeftChevronIcon, "ChevronLeft");
export const ChevronRight = withItsHover(RightChevron, "ChevronRight");
export const ChevronUp = withItsHover(UpChevronIcon, "ChevronUp");
export const Clock = withItsHover(ClockIcon, "Clock");
export const CreditCard = withItsHover(CreditCardRaw, "CreditCard");
export const DollarSign = withItsHover(CurrencyDollarIcon, "DollarSign");
export const Download = withItsHover(DownloadIcon, "Download");
export const Edit2 = withItsHover(PenIcon, "Edit2");
export const Edit3 = withItsHover(PenIcon, "Edit3");
export const Equal = withItsHover(AlignCenterIcon, "Equal");
export const ExternalLink = withItsHover(ExternalLinkIcon, "ExternalLink");
export const Eye = withItsHover(EyeIcon, "Eye");
export const EyeOff = withItsHover(EyeOffIcon, "EyeOff");
export const FileCheck = withItsHover(FileDescriptionIcon, "FileCheck");
export const FileSpreadsheet = withItsHover(FileDescriptionIcon, "FileSpreadsheet");
export const FileText = withItsHover(FileDescriptionIcon, "FileText");
export const Filter = withItsHover(FilterIcon, "Filter");
export const Flag = withItsHover(TargetIcon, "Flag");
export const Gift = withItsHover(PartyPopperIcon, "Gift");
export const Globe = withItsHover(GlobeIcon, "Globe");
export const Hash = withItsHover(HashtagIcon, "Hash");
export const History = withItsHover(HistoryCircleIcon, "History");
export const Image = withItsHover(CameraIcon, "Image");
export const LayoutDashboard = withItsHover(LayoutDashboardIcon, "LayoutDashboard");
export const List = withItsHover(UnorderedListIcon, "List");
export const Loader2 = withItsHover(Loader2Icon, "Loader2");
export const Lock = withItsHover(LockIcon, "Lock");
export const LogIn = withItsHover(ArrowBigRightDashIcon, "LogIn");
export const LogOut = withItsHover(LogoutIcon, "LogOut");
export const MapPin = withItsHover(MapPinIcon, "MapPin");
export const Medal = withItsHover(StarIcon, "Medal");
export const Megaphone = withItsHover(Volume2Icon, "Megaphone");
export const MessageCircle = withItsHover(MessageCircleIcon, "MessageCircle");
export const MessageSquareWarning = withItsHover(MessageCircleIcon, "MessageSquareWarning");
export const Minus = withItsHover(MinusIcon, "Minus");
export const MinusCircle = withItsHover(MinusCircleIcon, "MinusCircle");
export const Moon = withItsHover(MoonIcon, "Moon");
export const MoreHorizontal = withItsHover(DotsHorizontalIcon, "MoreHorizontal");
export const MoreVertical = withItsHover(DotsVerticalIcon, "MoreVertical");
export const Package = withItsHover(PackageIcon, "Package");
export const PackagePlus = withItsHover(PackagePlusIcon, "PackagePlus");
export const Paperclip = withItsHover(LinkIcon, "Paperclip");
export const Pencil = withItsHover(PenIcon, "Pencil");
export const Percent = withItsHover(RosetteDiscountIcon, "Percent");
export const Phone = withItsHover(TelephoneIcon, "Phone");
export const PieChart = withItsHover(ChartPieIcon, "PieChart");
export const Plus = withItsHover(PlusIcon, "Plus");
export const PlusCircle = withItsHover(PlusCircleIcon, "PlusCircle");
export const Printer = withItsHover(PrinterIcon, "Printer");
export const QrCode = withItsHover(QrCodeIcon, "QrCode");
export const Receipt = withItsHover(FileDescriptionIcon, "Receipt");
export const RefreshCw = withItsHover(RefreshIcon, "RefreshCw");
export const RotateCcw = withItsHover(ArrowBackUpIcon, "RotateCcw");
export const Save = withItsHover(SaveIcon, "Save");
export const Search = withItsHover(MagnifierIcon, "Search");
export const Send = withItsHover(SendIcon, "Send");
export const Settings = withItsHover(GearIcon, "Settings");
export const Share2 = withItsHover(SendHorizontalIcon, "Share2");
export const Shield = withItsHover(ShieldCheckRaw, "Shield");
export const ShieldAlert = withItsHover(TriangleAlertIcon, "ShieldAlert");
export const ShieldCheck = withItsHover(ShieldCheckRaw, "ShieldCheck");
export const ShoppingBag = withItsHover(TravelBag, "ShoppingBag");
export const ShoppingCart = withItsHover(ShoppingCartIcon, "ShoppingCart");
export const SlidersHorizontal = withItsHover(SlidersHorizontalIcon, "SlidersHorizontal");
export const Sparkles = withItsHover(SparklesIcon, "Sparkles");
export const Store = withItsHover(StoreIcon, "Store");
export const Sun = withItsHover(BrightnessDownIcon, "Sun");
export const Tag = withItsHover(BookmarkIcon, "Tag");
export const Tags = withItsHover(BookmarkIcon, "Tags");
export const Trash2 = withItsHover(TrashIcon, "Trash2");
export const TrendingDown = withItsHover(ChartHistogramIcon, "TrendingDown");
export const TrendingUp = withItsHover(ChartLineIcon, "TrendingUp");
export const Trophy = withItsHover(TrophyIcon, "Trophy");
export const Upload = withItsHover(UploadIcon, "Upload");
export const User = withItsHover(UserIcon, "User");
export const UserPen = withItsHover(UserCheckIcon, "UserPen");
export const Users = withItsHover(UsersIcon, "Users");
export const Wallet = withItsHover(WalletIcon, "Wallet");
export const Wrench = withItsHover(WrenchIcon, "Wrench");
export const X = withItsHover(XIcon, "X");
export const XCircle = withItsHover(XIcon, "XCircle");

// Additional itshover exports
export const Lightbulb = withItsHover(BulbSvg, "Lightbulb");
export const Rocket = withItsHover(RocketIcon, "Rocket");
export const Whatsapp = withItsHover(WhatsappIconRaw, "Whatsapp");
export const ChartBar = withItsHover(ChartBarIcon, "ChartBar");
export const Cart = withItsHover(CartIcon, "Cart");
export const Stack3 = withItsHover(Stack3Icon, "Stack3");
