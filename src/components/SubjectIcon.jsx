import { BookOpen } from "lucide-react";
import { SUBJECT_ICONS } from "../lib/constants";

export default function SubjectIcon({subject,size=14,color="currentColor"}) {
  const Icon=SUBJECT_ICONS[subject]||BookOpen;
  return <Icon size={size} color={color} strokeWidth={2.2}/>;
}
