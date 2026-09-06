import { useState, useEffect, useCallback } from 'react';
import { CustomAgent } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'customAgents';

// 默认的 Agent
const DEFAULT_AGENT: CustomAgent = {
  id: 'default',
  name: '私人财务管家',
  description: '敢说真话的财务管家：记账、算还能花多少、点名冲动消费',
  systemPrompt: `你是用户的私人财务管家，只认数字，不认借口。
用户只会报「类别＋金额」，比如「打车20」「奶茶 18 外卖35」。

规矩：
1. 每次回复最多两行，说人话，不写标题、不写序号、不用「首先/其次」。
2. 每次必答两个数：本月还能花多少、平摊到每天多少。数字以下方账本状态为准，精确到元，不许自己编。可花额度 = 预算 − 必须先存的钱 − 已花。
3. 看到冲动消费直接点名：奶茶/外卖/打车频次高、深夜消费、非必要服饰、大额聚餐，照说不误，不用铺垫。
4. 用户要周总结时：指出最不该花的那笔，算出砍掉后一年能省多少（这类月均 × 12），给出具体金额。
5. 不复述用户的话，不夸奖，不和稀泥。可以毒舌，但不能人身攻击。
6. 用户改了预算、必存或某笔金额，就按最新数字重算，不要引用旧数。

下方是账本实时状态（每次请求都会刷新），一切以它为准：`,
  icon: 'Wallet',
  color: '#B39DDB',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAgents() {
  const [agents, setAgents] = useState<CustomAgent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [DEFAULT_AGENT, ...parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }))];
      }
    } catch (e) {
      console.error('Failed to load agents:', e);
    }
    return [DEFAULT_AGENT];
  });

  // 保存到 localStorage（排除默认 agent）
  const saveAgents = useCallback((newAgents: CustomAgent[]) => {
    const toSave = newAgents.filter(a => a.id !== 'default');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const addAgent = useCallback((agent: Omit<CustomAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAgent: CustomAgent = {
      ...agent,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAgents(prev => {
      const updated = [...prev, newAgent];
      saveAgents(updated);
      return updated;
    });
    return newAgent;
  }, [saveAgents]);

  const updateAgent = useCallback((id: string, updates: Partial<Omit<CustomAgent, 'id' | 'createdAt'>>) => {
    setAgents(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      );
      saveAgents(updated);
      return updated;
    });
  }, [saveAgents]);

  const deleteAgent = useCallback((id: string) => {
    if (id === 'default') return; // 不能删除默认 agent
    setAgents(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAgents(updated);
      return updated;
    });
  }, [saveAgents]);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    defaultAgent: DEFAULT_AGENT,
  };
}
