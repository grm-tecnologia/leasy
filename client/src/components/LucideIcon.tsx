import {
  Users, Scale, Megaphone, Wallet, Building, FolderOpen,
  Database, ShoppingCart, BarChart3, Upload, Search,
  Globe, Mail, Phone, MapPin, Briefcase, Heart, Star,
  Zap, Shield, Target, TrendingUp, DollarSign, FileText,
  Camera, Video, Mic, Palette, Code, Layers, Box,
  type LucideIcon as LucideIconType,
} from "lucide-react";

const iconMap: Record<string, LucideIconType> = {
  Users, Scale, Megaphone, Wallet, Building, FolderOpen,
  Database, ShoppingCart, BarChart3, Upload, Search,
  Globe, Mail, Phone, MapPin, Briefcase, Heart, Star,
  Zap, Shield, Target, TrendingUp, DollarSign, FileText,
  Camera, Video, Mic, Palette, Code, Layers, Box,
};

interface LucideIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function LucideIcon({ name, className, style }: LucideIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return <FolderOpen className={className} style={style} />;
  return <Icon className={className} style={style} />;
}
