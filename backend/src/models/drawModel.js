const supabase = require("../config/supabase");

const createDraw = async (
  drawDate,
  drawType,
  drawMode
) => {
  const { data, error } = await supabase
    .from("draws")
    .insert({
      draw_date: drawDate,
      draw_type: drawType,
      draw_mode: drawMode,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const getDraws = async () => {
  const { data, error } = await supabase
    .from("draws")
    .select("*")
    .order("draw_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

const updateDraw = async (id, updates) => {
  const { data, error } = await supabase
    .from("draws")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  createDraw,
  getDraws,
  updateDraw,
};