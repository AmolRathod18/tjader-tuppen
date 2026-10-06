import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';

export default function ApprovedFeedback() {
  const { lang, tp } = useLanguage();
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadApprovedFeedback = async () => {
      const { data, error: queryError } = await supabase
        .from('feedback')
        .select('id, name, rating, message, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!mounted) return;
      if (queryError) {
        setError(tp('Approved feedback could not be loaded.'));
        console.error('Unable to load approved feedback:', queryError);
        return;
      }
      setError('');
      setFeedback(data || []);
    };
    const channel = supabase
      .channel('public-approved-feedback')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feedback',
      }, loadApprovedFeedback)
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Unable to subscribe to realtime approved feedback:', status);
        }
      });
    loadApprovedFeedback();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [lang, tp]);

  if (!feedback.length && !error) return null;

  return (
    <section className="tj-feedback-section" aria-labelledby="public-feedback-title" data-header-theme="light">
      <div className="tj-feedback-heading">
        <p className="tj-eyebrow"><span /> {tp('Feedback')}</p>
        <h2 id="public-feedback-title">{tp('A few words from our customers')}</h2>
      </div>
      {error
        ? <p className="tj-feedback-empty" role="status">{error}</p>
        : (
          <div className="tj-feedback-list">
            {feedback.map(item => (
              <article className="tj-feedback-card" key={item.id}>
                {item.rating && (
                  <div className="tj-feedback-rating" aria-label={tp('{0} out of 5 stars', [item.rating])}>
                    {Array.from({ length: item.rating }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}
                  </div>
                )}
                <p>{item.message}</p>
                <span>{item.name}</span>
              </article>
            ))}
          </div>
        )}
    </section>
  );
}
