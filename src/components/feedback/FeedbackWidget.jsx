import React, { useState } from 'react';
import { MessageSquareText, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import './Feedback.css';

export default function FeedbackWidget() {
  const { tp } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const describeSubmissionError = submitError => {
    if (submitError.code === '42P01' || submitError.code === 'PGRST205') {
      return tp('Feedback storage is not set up yet. Apply the public feedback migration in Supabase.');
    }
    if (submitError.code === '42501' || submitError.code === 'PGRST301') {
      return tp('Feedback submission is blocked by database permissions. Reapply the public feedback migration.');
    }
    return `${tp('Your feedback could not be submitted. Please try again.')} ${submitError.message || ''}`.trim();
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || trimmedName.length > 80 || !trimmedMessage || trimmedMessage.length > 2000) {
      setError(tp('Please enter your name and a message of up to 2000 characters.'));
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('feedback').insert({
        name: trimmedName,
        rating,
        message: trimmedMessage,
      });
      if (insertError) {
        setError(describeSubmissionError(insertError));
        console.error('Unable to submit public feedback:', insertError);
      } else {
        setName('');
        setRating(null);
        setMessage('');
        setIsOpen(false);
        setSuccess(tp('Thank you. Your feedback has been sent for review.'));
        window.setTimeout(() => setSuccess(''), 5000);
      }
    } catch (submitError) {
      setError(describeSubmissionError(submitError));
      console.error('Unable to submit public feedback:', submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-widget">
      <button
        type="button"
        className="feedback-launcher"
        aria-label={tp('Feedback')}
        onClick={() => {
          setError('');
          setIsOpen(true);
        }}
      >
        <MessageSquareText size={16} />
        <span>{tp('Feedback')}</span>
      </button>
      {success && <div className="feedback-toast" role="status">{success}</div>}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={tp('Share your feedback')}
        subtitle={tp('Tell us about your experience. Feedback is reviewed before it is published.')}
        size="sm"
        className="feedback-modal"
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)} disabled={submitting}>
              {tp('Cancel')}
            </button>
            <button type="submit" form="public-feedback-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? tp('Sending…') : tp('Send feedback')}
            </button>
          </>
        )}
      >
        <form id="public-feedback-form" className="feedback-form" onSubmit={handleSubmit}>
          <label>
            {tp('Your name')}
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={80}
              required
              autoComplete="name"
            />
          </label>
          <fieldset className="feedback-rating">
            <legend>{tp('Rating')} <span>{tp('optional')}</span></legend>
            <div role="group" aria-label={tp('Rating')}>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={rating === value}
                  aria-label={tp('{0} out of 5 stars', [value])}
                  className={rating !== null && value <= rating ? 'is-selected' : ''}
                  onClick={() => setRating(current => current === value ? null : value)}
                >
                  <Star size={19} fill={rating !== null && value <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            {tp('Your feedback')}
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              maxLength={2000}
              rows={4}
              required
            />
            <span className="feedback-character-count">{message.length}/2000</span>
          </label>
          {error && <p className="feedback-form-error" role="alert">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
