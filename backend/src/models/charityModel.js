const supabase = require("../config/supabase");

const getAllCharities = async () => {
  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  getAllCharities,
};