import { Button, Tooltip, Select } from 'tdesign-react';
import { RefreshIcon, MenuFoldIcon, MenuUnfoldIcon, ChevronDownIcon } from 'tdesign-icons-react';
import { Wallet } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { Model, Session, Agent } from '../types';

interface HeaderProps {
  isSettingsPage: boolean;
  sidebarOpen: boolean;
  currentSession: Session | undefined;
  currentAgent: Agent | undefined;
  models: Model[];
  selectedModel: string;
  onToggleSidebar: () => void;
  onRefreshModels: () => void;
  onModelChange: (modelId: string) => void;
}

export function Header({
  isSettingsPage,
  sidebarOpen,
  currentSession,
  models,
  selectedModel,
  onToggleSidebar,
  onRefreshModels,
  onModelChange,
}: HeaderProps) {
  return (
    <header
      className="h-14 flex justify-between items-center px-4 flex-shrink-0"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="text"
          shape="circle"
          icon={sidebarOpen ? <MenuFoldIcon /> : <MenuUnfoldIcon />}
          onClick={onToggleSidebar}
        />
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f4a7c4,#b79ce0)', color: '#fff' }}
        >
          <Wallet size={16} />
        </div>
        <div className="leading-tight">
          <h1 className="text-[15px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>
            {isSettingsPage ? '设置' : APP_CONFIG.name}
          </h1>
          {!isSettingsPage && (
            <div className="fm-label">{currentSession ? currentSession.title : APP_CONFIG.description}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isSettingsPage && (
          <>
            <Select
              value={selectedModel}
              onChange={value => onModelChange(value as string)}
              placeholder="选择模型"
              size="small"
              style={{ width: 170 }}
              filterable
              borderless
              suffixIcon={<ChevronDownIcon />}
            >
              {models.map(model => (
                <Select.Option key={model.modelId} value={model.modelId} label={model.name} />
              ))}
            </Select>
            <Tooltip content="刷新模型列表">
              <Button
                variant="outline"
                shape="circle"
                icon={<RefreshIcon />}
                onClick={onRefreshModels}
              />
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}
