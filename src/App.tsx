import { Button, PluginPanel, useDawnDesk } from '@dawndesk/ui'
import { TemplateFeature, useTemplateState } from './features/template'
import './App.css'

function App() {
  const { pluginInfo } = useDawnDesk()
  const templateState = useTemplateState()
  const pluginName = pluginInfo?.name ?? 'Plugin Template'
  const pluginId = pluginInfo?.id ?? 'plugin-template'
  const pluginVersion = pluginInfo?.version ?? '0.1.0'

  return (
    <PluginPanel
      title={pluginName}
      subtitle="A ready-to-clone DawnDesk plugin starter"
      toolbarActions={
        <div className="template-actions">
          <Button variant="ghost" onClick={templateState.loadExampleState}>
            Load state
          </Button>
          <Button variant="primary" onClick={templateState.saveExampleState}>
            Save state
          </Button>
        </div>
      }
      statusBar={`${pluginId} v${pluginVersion} - ${templateState.status}`}
    >
      <TemplateFeature pluginId={pluginId} savedState={templateState.savedState} />
    </PluginPanel>
  )
}

export default App
