const allowedTransitions = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "refunded"],
  shipped: ["delivered"],
  delivered: [],
  refunded: []
}

export function canTransition(current, next) {
  return allowedTransitions[current]?.includes(next)
}