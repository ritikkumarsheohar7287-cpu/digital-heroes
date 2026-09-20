const supabase = require("../config/supabase");

const addScore = async (userId, score, scoreDate) => {
  const { data, error } = await supabase
    .from("scores")
    .insert({
      user_id: userId,
      score: score,
      score_date: scoreDate,
    })
    .select()
    .single();

  if (error) {
    console.log("SCORE DB ERROR:", error);
    throw error;
  }

  return data;
};

const getLastFiveScores = async (userId) => {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", userId)
    .order("score_date", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return data;
};

const updateScore = async (id, userId, score, scoreDate) => {
  const { data, error } = await supabase
    .from("scores")
    .update({
      score,
      score_date: scoreDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const deleteScore = async (id, userId) => {
  const { data, error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  addScore,
  getLastFiveScores,
  updateScore,
  deleteScore,
};