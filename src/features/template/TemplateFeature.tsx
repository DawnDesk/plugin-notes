import { Badge, Card, EmptyState, Tag } from '@dawndesk/ui'
import type { TemplateState } from './types'
import './TemplateFeature.css'

type TemplateFeatureProps = {
  pluginId: string
  savedState: TemplateState | null
}

export function TemplateFeature({ pluginId, savedState }: TemplateFeatureProps) {
  return (
    <div className="template-shell">
      <section className="template-hero" aria-labelledby="template-title">
        <div className="template-hero__copy">
          <Badge>Template</Badge>
          <h2 id="template-title">Build inside the host, keep plugins scoped.</h2>
          <p>
            Replace this feature with plugin-specific UI. Keep data, AI calls,
            events, and file access flowing through the DawnDesk bridge.
          </p>
        </div>
        <div className="template-hero__meta" aria-label="Plugin metadata">
          <Tag>{pluginId}</Tag>
          <Tag>React + TypeScript</Tag>
          <Tag>Rust backend</Tag>
        </div>
      </section>

      <div className="template-grid">
        <Card
          title="Frontend contract"
          description="Use the shared design system and host bridge."
        >
          <ul className="template-list">
            <li>Wrap the root screen in PluginPanel.</li>
            <li>Put plugin-specific UI under src/features.</li>
            <li>Call host services with useDawnDesk().</li>
          </ul>
        </Card>

        <Card
          title="Manifest contract"
          description="Declare identity, permissions, and AI tools."
        >
          <ul className="template-list">
            <li>Update plugin.manifest.json first.</li>
            <li>Keep permissions as narrow as the feature allows.</li>
            <li>Match each AI tool to a Rust command handler.</li>
          </ul>
        </Card>

        <Card
          title="Saved example"
          description="This card reads and writes through the scoped plugin store."
        >
          {savedState ? (
            <dl className="template-data">
              <div>
                <dt>Message</dt>
                <dd>{savedState.message}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(savedState.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          ) : (
            <EmptyState
              title="Nothing saved"
              description="Use the toolbar action to test the host-scoped data bridge."
            />
          )}
        </Card>
      </div>
    </div>
  )
}
