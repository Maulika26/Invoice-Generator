'use client';

export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="page-header">
        <div>
          <Skeleton className="skeleton-title" style={{ width: '200px' }} />
          <Skeleton className="skeleton-text" style={{ width: '150px' }} />
        </div>
      </div>

      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="skeleton-stat" />
        ))}
      </div>

      <div className="dashboard-grid" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <Skeleton className="skeleton-text" style={{ width: '120px', margin: 0 }} />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="skeleton-table-row" />
          ))}
        </div>
        <div className="card">
          <div className="card-header">
            <Skeleton className="skeleton-text" style={{ width: '120px', margin: 0 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: '50px', width: '100%' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoiceListSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="page-header">
        <div>
          <Skeleton className="skeleton-title" style={{ width: '180px' }} />
          <Skeleton className="skeleton-text" style={{ width: '100px' }} />
        </div>
        <Skeleton style={{ width: '130px', height: '40px' }} />
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <Skeleton style={{ flex: 1, height: '40px' }} />
        <Skeleton style={{ width: '130px', height: '40px' }} />
      </div>

      <div className="table-container">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="skeleton-table-row" />
        ))}
      </div>
    </div>
  );
}

export function InvoiceDetailSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="no-print">
        <Skeleton className="skeleton-text" style={{ width: '120px', marginBottom: 'var(--space-4)' }} />
        <div className="invoice-actions-bar" style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} style={{ width: '90px', height: '32px' }} />)}
        </div>
      </div>

      <div className="invoice-detail-card" style={{ padding: 'var(--space-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-10)' }}>
          <div>
            <Skeleton className="skeleton-avatar" style={{ marginBottom: 'var(--space-4)' }} />
            <Skeleton className="skeleton-title" style={{ width: '200px' }} />
            <Skeleton className="skeleton-text" style={{ width: '150px' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Skeleton className="skeleton-title" style={{ width: '120px', marginLeft: 'auto' }} />
            <Skeleton className="skeleton-text" style={{ width: '100px', marginLeft: 'auto' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-10)', marginBottom: 'var(--space-10)' }}>
          <div>
            <Skeleton className="skeleton-text" style={{ width: '80px' }} />
            <Skeleton className="skeleton-text" style={{ width: '180px' }} />
            <Skeleton className="skeleton-text" style={{ width: '140px' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Skeleton className="skeleton-text" style={{ width: '80px', marginLeft: 'auto' }} />
            <Skeleton className="skeleton-text" style={{ width: '120px', marginLeft: 'auto' }} />
          </div>
        </div>

        <Skeleton className="skeleton-rect" style={{ height: '200px', marginBottom: 'var(--space-6)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '250px' }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="skeleton-text" style={{ marginBottom: 'var(--space-2)' }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
