const supabase = require("../config/supabase");

const createSubscription = async (
  userId,
  plan,
  amount,
  charityPercentage = 10
) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan,
      amount,
      charity_percentage: charityPercentage,
      charity_amount:
        (amount * charityPercentage) / 100,
      status: "active",
      current_period_start:
        new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

const getUserSubscription = async (userId) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(1);

  if (error) throw error;

  return data && data.length > 0
    ? data[0]
    : null;
};

const cancelSubscription = async (
  id,
  userId
) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "active")
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(
        "Active subscription not found"
      );
    }

    throw error;
  }

  return data;
};

module.exports = {
  createSubscription,
  getUserSubscription,
  cancelSubscription,
};