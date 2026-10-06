import React, { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, MessageSquareText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import '../components/feedback/Feedback.css';

export default function Feedback() {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadFeedback = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('feedback')
      .select('id, name, rating, message, is_read, is_approved, created_at')
      .order('created_at', { ascending: false });
    if (showLoading) setLoading(false);
    if (queryError) {
      setError(t('feedback_load_error'));
      console.error('Unable to load admin feedback:', queryError);
      return;
    }
    setItems(data || []);
  }, [t]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-feedback-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feedback',
      }, () => loadFeedback(false))
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Unable to subscribe to realtime feedback list:', status);
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [loadFeedback]);

  const updateItem = async (item, updates) => {
    setUpdatingId(item.id);
    setError('');
    const { data, error: updateError } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', item.id)
      .select('id, name, rating, message, is_read, is_approved, created_at')
      .single();
    setUpdatingId('');
    if (updateError) {
      setError(t('feedback_update_error'));
      console.error('Unable to update feedback:', updateError);
      return;
    }
    setItems(current => current.map(existing => existing.id === item.id ? data : existing));
    window.dispatchEvent(new Event('feedback-updated'));
  };

  const formatDate = value => new Intl.DateTimeFormat(lang === 'sv' ? 'sv-SE' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

  return (
    <div className="admin-feedback-page">
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('feedback_title')}</h2>
          <p>{t('feedback_subtitle')}</p>
        </div>
      </div>
      {error && <div className="form-submit-error" role="alert">{error}</div>}
      {loading
        ? <div className="card-body">{t('feedback_loading')}</div>
        : items.length === 0
          ? <div className="card admin-feedback-empty"><MessageSquareText size={22} /><p>{t('feedback_empty')}</p></div>
          : (
            <div className="admin-feedback-list">
              {items.map(item => (
                <article className={`card admin-feedback-card${item.is_read ? '' : ' is-unread'}`} key={item.id}>
                  <div className="admin-feedback-card-header">
                    <div>
                      <h3>{item.name}</h3>
                      <p><Clock3 size={13} /> {formatDate(item.created_at)}</p>
                    </div>
                    <div className="admin-feedback-status">
                      {!item.is_read && <span className="feedback-status-unread">{t('feedback_unread')}</span>}
                      {item.is_approved && <span className="feedback-status-approved">{t('feedback_approved')}</span>}
                    </div>
                  </div>
                  {item.rating && <p className="admin-feedback-rating">{t('feedback_rating', [item.rating])}</p>}
                  <p className="admin-feedback-message">{item.message}</p>
                  <div className="admin-feedback-actions">
                    {!item.is_read && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={updatingId === item.id}
                        onClick={() => updateItem(item, { is_read: true })}
                      >
                        {t('feedback_mark_read')}
                      </button>
                    )}
                    {!item.is_approved && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={updatingId === item.id}
                        onClick={() => updateItem(item, { is_approved: true, is_read: true })}
                      >
                        <Check size={14} /> {t('feedback_approve')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
    </div>
  );
}
