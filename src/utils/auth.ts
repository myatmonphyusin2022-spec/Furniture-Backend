// ==========================================
// AUTH UTILS & HELPER FUNCTIONS
// ==========================================

/**
 * 1. အကောင့်ရှိပြီးသားလား စစ်ဆေးပေးသည့် Helper Function
 * @param user - Database မှ ရှာဖွေတွေ့ရှိထားသော User Data
 */
export const checkUserExists = (user: any) => {
  if (user) {
    // User ရှိနေပါက အကောင့်ဖွင့်ပြီးသားဖြစ်၍ Error သတ်မှတ်ခြင်း
    const error: any = new Error("Phone number already exists");
    error.status = 409; // 409 Conflict Status Code
    error.code = "Error_already_exists";
    throw error; // Controller ရဲ့ catch block ဆီ Error ပို့လိုက်ခြင်း
  }
};

/**
 * 2. ဒီနေ့အတွက် OTP အမှားအကြိမ်ရေ အကန့်အသတ် စစ်ဆေးပေးသည့် Helper Function
 * @param isSameDate - နောက်ဆုံး OTP တောင်းဆိုခဲ့သည့် ရက်စွဲနှင့် ဒီနေ့ရက်စွဲ တူမတူ (Boolean)
 * @param errorCount - ယခင်က မှားယွင်းထားသည့် အကြိမ်ရေ
 */
export const checkOtpErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number,
) => {
  // ဒီနေ့အတိုင်းဖြစ်ပြီး အမှား ၅ ကြိမ် ပြည့်နေပါက တားမြစ်ခြင်း
  if (isSameDate && errorCount === 5) {
    const error: any = new Error(
      "OTP is wrong 5 times, please try again tomorrow",
    );
    error.status = 401; // 401 Unauthorized Status Code
    error.code = "Error_OverLimit";
    throw error; // Brute-force Attack ကာကွယ်ရန် Error throw လုပ်ခြင်း
  }
};

/**
 * 3. Database ထဲတွင် OTP တောင်းဆိုထားသည့် Record ရှိမရှိ စစ်ဆေးပေးသည့် Helper Function
 * @param otpRow - Database မှ ရှာဖွေတွေ့ရှိထားသော OTP Record
 */
export const checkOtpRowExists = (otpRow: any) => {
  // OTP တောင်းဆိုထားသည့် Record မရှိပါက
  if (!otpRow) {
    const error: any = new Error("Phone number is incorrect");
    error.status = 404; // 404 Not Found Status Code
    error.code = "Error_NotFound";
    throw error; // OTP မတောင်းဘဲ တိုက်ရိုက် verify လုပ်ခြင်းကို တားမြစ်ခြင်း
  }
};
