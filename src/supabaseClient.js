import { createClient } from "@supabase/supabase-js";

// NOTE: these are the Supabase project URL + public "publishable" key.
// (Accepted tradeoff per project notes: RLS not yet enforced.)
export const supabase = createClient(
  "https://ddfmkfkvvadzlihiulnj.supabase.co",
  "sb_publishable_CX_sPadRs8lkJZ2pHyQuZw_vHA_D4P6"
);
