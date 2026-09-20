const supabase = require("../config/supabase");

const createProfile = async (
  userId,
  fullName,
  charityId,
  charityPercentage
) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: fullName,
      selected_charity_id: charityId,
      charity_percentage: charityPercentage || 10,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const getProfileById = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Profile not found");
  }

  return data[0];
};

module.exports = {
  createProfile,
  getProfileById,
};