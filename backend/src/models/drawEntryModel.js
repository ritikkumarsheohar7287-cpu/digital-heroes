const supabase = require("../config/supabase");

const createEntry = async (
  drawId,
  userId,
  selectedNumbers
) => {
  const { data, error } = await supabase
    .from("draw_entries")
    .insert({
      draw_id: drawId,
      user_id: userId,
      selected_numbers: selectedNumbers,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

const getEntriesByDraw = async (drawId) => {
  const { data, error } = await supabase
    .from("draw_entries")
    .select("*")
    .eq("draw_id", drawId);

  if (error) throw error;

  return data;
};

module.exports = {
  createEntry,
  getEntriesByDraw,
};