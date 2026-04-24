/**
 * 财务健康风险评估计算器
 * 
 * 评估维度：
 * 1. 预算使用率 (40%)
 * 2. 收支平衡 (30%)
 * 3. 交易频率 (30%)
 */

/**
 * 计算风险因素分数
 * @param {number} income - 收入
 * @param {number} expense - 支出
 * @param {number} budget - 预算
 * @param {number} transactionCount - 交易次数（可选）
 * @returns {Object} 各项风险分数
 */
function calculateRiskFactors(income, expense, budget, transactionCount = 0) {
  // 1. 预算使用率评分（0-100）
  const usageRate = budget > 0 ? (expense / budget) : 0;
  let budgetScore = 100;
  if (usageRate > 1) budgetScore = 0;
  else if (usageRate > 0.9) budgetScore = 30;
  else if (usageRate > 0.8) budgetScore = 50;
  else if (usageRate > 0.6) budgetScore = 70;
  else budgetScore = 100;

  // 2. 收支平衡评分
  let balanceScore = 100;
  if (expense > income * 1.5) balanceScore = 0;
  else if (expense > income) balanceScore = 30;
  else if (expense > income * 0.8) balanceScore = 60;
  else balanceScore = 100;

  // 3. 交易频率评分
  let frequencyScore = 100;
  if (transactionCount > 100) frequencyScore = 60;
  else if (transactionCount > 50) frequencyScore = 80;
  else frequencyScore = 100;

  return { budgetScore, balanceScore, frequencyScore };
}

/**
 * 根据综合评分获取风险等级
 * @param {number} score - 综合评分 (0-100)
 * @returns {string} 风险等级: 'high' | 'medium' | 'low'
 */
function getRiskLevel(score) {
  if (score < 40) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

/**
 * 计算综合风险评分
 * @param {Object} factors - 风险因素分数
 * @returns {number} 综合评分 (0-100)
 */
function calculateTotalScore(factors) {
  const { budgetScore, balanceScore, frequencyScore } = factors;
  return Math.round(
    budgetScore * 0.4 + 
    balanceScore * 0.3 + 
    frequencyScore * 0.3
  );
}

/**
 * 获取风险标签文字
 * @param {string} riskLevel - 风险等级
 * @returns {string} 风险标签
 */
function getRiskLabel(riskLevel) {
  const labels = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  };
  return labels[riskLevel] || '低风险';
}

/**
 * 获取风险建议
 * @param {string} riskLevel - 风险等级
 * @returns {string} 风险建议
 */
function getRiskAdvice(riskLevel) {
  const advice = {
    high: '您的财务状况存在较大风险，建议立即控制支出，避免超预算消费。',
    medium: '您的财务状况需要关注，建议合理规划支出，注意预算控制。',
    low: '您的财务状况健康，请继续保持良好的消费习惯。'
  };
  return advice[riskLevel] || advice.low;
}

module.exports = {
  calculateRiskFactors,
  getRiskLevel,
  calculateTotalScore,
  getRiskLabel,
  getRiskAdvice
};
