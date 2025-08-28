import React from 'react';
import { ViewState } from '../types';
import OfferForm from '../components/forms/OfferForm';
import OfferList from '../components/offers/OfferList';

interface OfferPageProps {
    view: ViewState;
    setView: (view: ViewState) => void;
}

const OfferPage = ({ view, setView }: OfferPageProps) => {
    if (view.id) {
        return <OfferForm setView={setView} offerId={view.id} />;
    }
    return <OfferList setView={setView} />;
};

export default OfferPage;