interface TabItem {
  id: string
  label: string
}

export function OverlayTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
}) {
  return (
    <div className='border-neutral-2000 border-b'>
      <div className='no-scrollbar mx-7 flex gap-2 overflow-x-auto'>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onChange(tab.id)}
              className={
                'px-3 py-1.75 text-sm font-medium whitespace-nowrap ' +
                (isActive
                  ? 'text-blue-1400 border-blue-1400 border-b-2'
                  : 'text-grey-1200 hover:text-blue-1400')
              }
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
