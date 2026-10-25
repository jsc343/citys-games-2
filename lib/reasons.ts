type Tr = (zh: string, en: string) => string;

export function reasonMessage(reason: string | undefined, tr: Tr): string {
  switch (reason) {
    case "points":
      return tr("遊戲幣不足", "Not enough points");
    case "stock":
      return tr("寶物或代幣數量不足", "Not enough items or tokens");
    case "inactive":
      return tr("此項目已下架", "This item is no longer available");
    case "same":
      return tr("請選擇不同的類別", "Pick a different category");
    case "done":
      return tr("今天已簽到", "Already checked in today");
    case "claimed":
      return tr("已領取過", "Already claimed");
    case "locked":
      return tr("尚未達成條件", "Requirement not met yet");
    case "sold_out":
      return tr("活動名額已滿", "This event is fully claimed");
    case "no_reward":
      return tr("上週名次未達獎勵範圍", "Last week's rank earned no reward");
    case "not_found":
      return tr("找不到對應的邀請碼", "Code not found");
    case "self":
      return tr("不能使用自己的邀請碼", "You can't use your own code");
    case "already":
      return tr("你已經輸入過邀請碼", "You already used an invite code");
    case "cap":
      return tr("該邀請人本月名額已滿", "That inviter reached this month's limit");
    case "exists":
      return tr("已在好友清單中", "Already in your friends list");
    case "limit":
      return tr("今日互贈次數已達上限", "Daily gift limit reached");
    case "too_many_pending":
      return tr("待確認的兌換過多，請稍後", "Too many pending exchanges. Please wait.");
    case "amount":
      return tr("兌換數量不正確", "Invalid amount");
    case "rate_limit":
      return tr("提交過於頻繁，請稍後", "Too many submissions. Please try later.");
    default:
      return tr("操作失敗，請稍後再試", "Something went wrong. Please try again.");
  }
}
