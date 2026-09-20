const supabase = require("../config/supabase");

const testDatabase = async () => {
  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .limit(1);

  if (error) {
    throw error;
  }

  return data;
};

module.exports = testDatabase;