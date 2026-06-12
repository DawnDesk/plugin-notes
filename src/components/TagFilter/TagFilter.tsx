import { Button } from '@dawndesk/ui'
import './TagFilter.css'

type TagFilterProps = {
  selectedTag: string | null
  tags: string[]
  onSelectTag: (tag: string | null) => void
}

export function TagFilter({ selectedTag, tags, onSelectTag }: TagFilterProps) {
  return (
    <section className="tag-filter" aria-label="Filter by tag">
      <div className="tag-filter__header">
        <span>Tags</span>
        {selectedTag ? (
          <Button variant="ghost" onClick={() => onSelectTag(null)}>
            Clear
          </Button>
        ) : null}
      </div>
      <div className="tag-filter__items">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <button
              className={`tag-filter__item ${selectedTag === tag ? 'tag-filter__item--active' : ''}`}
              key={tag}
              type="button"
              onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))
        ) : (
          <span className="tag-filter__empty">Add comma-separated tags to notes.</span>
        )}
      </div>
    </section>
  )
}
