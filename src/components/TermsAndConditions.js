import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TermsAndConditions = ({ onAccept, onDecline }) => {
  const { t } = useTranslation();
  const [hasRead, setHasRead] = useState(false);

  return (
    <div className="terms-modal">
      <div className="terms-content">
        <h2>{t('termsAndConditions.title')}</h2>
        
        <div className="terms-text">
          <h3>{t('termsAndConditions.purpose.title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('termsAndConditions.purpose.text') }} />

          <h3>{t('termsAndConditions.businessModel.title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: `${t('termsAndConditions.businessModel.noProfit')}${t('termsAndConditions.businessModel.commission')}${t('termsAndConditions.businessModel.transparency')}` }} />

          <h3>{t('termsAndConditions.liveDraws.title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('termsAndConditions.liveDraws.mandatory') }} />
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.liveDraws.liveStream') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.liveDraws.dateTime') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.liveDraws.method') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.liveDraws.recording') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.liveDraws.witnesses') }} />
          </ul>

          <h3>{t('termsAndConditions.organizerResponsibilities.title')}</h3>
          <ul>
            <li>{t('termsAndConditions.organizerResponsibilities.noProfit')}</li>
            <li>{t('termsAndConditions.organizerResponsibilities.liveDraw')}</li>
            <li>{t('termsAndConditions.organizerResponsibilities.deliverPrizes')}</li>
            <li>{t('termsAndConditions.organizerResponsibilities.transparency')}</li>
            <li>{t('termsAndConditions.organizerResponsibilities.compliance')}</li>
          </ul>

          <h3>{t('termsAndConditions.participantProtection.title')}</h3>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.participantProtection.secureData') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.participantProtection.securePayments') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.participantProtection.support') }} />
            <li dangerouslySetInnerHTML={{ __html: t('termsAndConditions.participantProtection.disputes') }} />
          </ul>

          <h3>{t('termsAndConditions.prohibitions.title')}</h3>
          <ul>
            <li>{t('termsAndConditions.prohibitions.profitRaffles')}</li>
            <li>{t('termsAndConditions.prohibitions.noLiveDraws')}</li>
            <li>{t('termsAndConditions.prohibitions.manipulation')}</li>
            <li>{t('termsAndConditions.prohibitions.dataMisuse')}</li>
            <li>{t('termsAndConditions.prohibitions.illegalRaffles')}</li>
          </ul>

          <h3>{t('termsAndConditions.contact.title')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('termsAndConditions.contact.text') }} />
        </div>

        <div className="terms-checkbox">
          <label>
            <input 
              type="checkbox" 
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
            />
            {t('termsAndConditions.checkbox')}
          </label>
        </div>

        <div className="terms-actions">
          <button 
            className="btn-secondary"
            onClick={onDecline}
          >
            {t('termsAndConditions.actions.cancel')}
          </button>
          <button 
            className="btn-primary"
            onClick={onAccept}
            disabled={!hasRead}
          >
            {t('termsAndConditions.actions.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
