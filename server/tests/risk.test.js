const mongoose = require('mongoose');
const { calculateRiskFactors, getRiskLevel } = require('../utils/riskCalculator');

// 风险评估算法测试
describe('风险评估算法测试', () => {
  describe('calculateRiskFactors - 计算风险因素', () => {
    it('应该给预算使用率超过100%的情况打0分', () => {
      const result = calculateRiskFactors(0, 6000, 5000);
      expect(result.budgetScore).toBe(0);
    });

    it('应该给预算使用率在90-100%的情况打30分', () => {
      const result = calculateRiskFactors(0, 4700, 5000);
      expect(result.budgetScore).toBe(30);
    });

    it('应该给预算使用率在80-90%的情况打50分', () => {
      const result = calculateRiskFactors(0, 4200, 5000);
      expect(result.budgetScore).toBe(50);
    });

    it('应该给预算使用率在60-80%的情况打70分', () => {
      const result = calculateRiskFactors(0, 3500, 5000);
      expect(result.budgetScore).toBe(70);
    });

    it('应该给预算使用率低于60%的情况打100分', () => {
      const result = calculateRiskFactors(0, 2000, 5000);
      expect(result.budgetScore).toBe(100);
    });

    it('应该给支出大于收入150%的情况打0分', () => {
      const result = calculateRiskFactors(1000, 2000, 5000);
      expect(result.balanceScore).toBe(0);
    });

    it('应该给支出大于收入但小于150%的情况打30分', () => {
      const result = calculateRiskFactors(1000, 1400, 5000);
      expect(result.balanceScore).toBe(30);
    });

    it('应该给支出占收入80-100%的情况打60分', () => {
      const result = calculateRiskFactors(1000, 850, 5000);
      expect(result.balanceScore).toBe(60);
    });

    it('应该给支出小于收入80%的情况打100分', () => {
      const result = calculateRiskFactors(1000, 600, 5000);
      expect(result.balanceScore).toBe(100);
    });

    it('应该给高频交易的情况打60分', () => {
      const result = calculateRiskFactors(1000, 500, 5000, 150);
      expect(result.frequencyScore).toBe(60);
    });

    it('应该给中频交易的情况打80分', () => {
      const result = calculateRiskFactors(1000, 500, 5000, 80);
      expect(result.frequencyScore).toBe(80);
    });

    it('应该给低频交易的情况打100分', () => {
      const result = calculateRiskFactors(1000, 500, 5000, 20);
      expect(result.frequencyScore).toBe(100);
    });
  });

  describe('getRiskLevel - 获取风险等级', () => {
    it('应该将分数低于40判定为高风险', () => {
      expect(getRiskLevel(39)).toBe('high');
      expect(getRiskLevel(0)).toBe('high');
    });

    it('应该将分数在40-70之间判定为中风险', () => {
      expect(getRiskLevel(40)).toBe('medium');
      expect(getRiskLevel(55)).toBe('medium');
      expect(getRiskLevel(69)).toBe('medium');
    });

    it('应该将分数高于70判定为低风险', () => {
      expect(getRiskLevel(70)).toBe('low');
      expect(getRiskLevel(100)).toBe('low');
    });
  });

  describe('综合评分计算', () => {
    it('应该正确计算综合评分', () => {
      // 预算得分: 50 (使用84%), 收支得分: 60 (支出850/收入1000), 频率得分: 80
      // 综合: 50*0.4 + 60*0.3 + 80*0.3 = 20 + 18 + 24 = 62
      const factors = calculateRiskFactors(1000, 4200, 5000, 80);
      const totalScore = Math.round(
        factors.budgetScore * 0.4 + 
        factors.balanceScore * 0.3 + 
        factors.frequencyScore * 0.3
      );
      expect(totalScore).toBe(62);
      expect(getRiskLevel(totalScore)).toBe('medium');
    });

    it('健康财务状况应该得到高分', () => {
      // 收入高，支出低，预算使用合理
      const factors = calculateRiskFactors(10000, 3000, 5000, 30);
      const totalScore = Math.round(
        factors.budgetScore * 0.4 + 
        factors.balanceScore * 0.3 + 
        factors.frequencyScore * 0.3
      );
      expect(totalScore).toBeGreaterThan(70);
      expect(getRiskLevel(totalScore)).toBe('low');
    });

    it('危险财务状况应该得到低分', () => {
      // 超预算，入不敷出，高频交易
      const factors = calculateRiskFactors(1000, 6000, 5000, 150);
      const totalScore = Math.round(
        factors.budgetScore * 0.4 + 
        factors.balanceScore * 0.3 + 
        factors.frequencyScore * 0.3
      );
      expect(totalScore).toBeLessThan(40);
      expect(getRiskLevel(totalScore)).toBe('high');
    });
  });
});
