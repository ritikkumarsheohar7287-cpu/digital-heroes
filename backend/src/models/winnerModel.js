const supabase = require("../config/supabase");

const updateEntry = async (
  entryId,
  matchCount,
  prizeTier,
  prizeAmount
) => {
  const { data, error } = await supabase
    .from("draw_entries")
    .update({
      match_count: matchCount,
      prize_tier: prizeTier,
      prize_amount: prizeAmount,
    })
    .eq("id", entryId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

const createWinner = async (
  drawEntryId,
  userId,
  payoutAmount
) => {
  const { data, error } = await supabase
    .from("winners")
    .insert({
      draw_entry_id: drawEntryId,
      user_id: userId,
      verification_status: "pending",
      payment_status: "pending",
      payout_amount: payoutAmount,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

const getAllWinners = async () => {
  const { data, error } = await supabase
    .from("winners")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
};

const updateVerification = async (
  winnerId,
  status
) => {
  const { data, error } = await supabase
    .from("winners")
    .update({
      verification_status: status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", winnerId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

const markPaid = async (winnerId) => {
  const { data, error } = await supabase
    .from("winners")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", winnerId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

module.exports = {
  updateEntry,
  createWinner,
  getAllWinners,
  updateVerification,
  markPaid,
};