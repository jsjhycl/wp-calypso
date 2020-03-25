/**
 * External dependencies
 */
import React, { FunctionComponent } from 'react';
import classnames from 'classnames';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch, useSelect } from '@wordpress/data';
import { useI18n } from '@automattic/react-i18n';
import { useHistory } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { STORE_KEY as ONBOARD_STORE } from '../../stores/onboard';
import { Design } from './types';
import designs from './available-designs.json';
import { usePath, Step } from '../../path';
import { isEnabled } from '../../../../config';
import Link from '../../components/link';
import './style.scss';
import { SubTitle, Title } from 'landing/gutenboarding/components/titles';

const DesignSelector: FunctionComponent = () => {
	const { __: NO__ } = useI18n();
	const { push } = useHistory();
	const makePath = usePath();
	const { selectedDesign, siteVertical, siteTitle } = useSelect( select =>
		select( ONBOARD_STORE ).getState()
	);
	const { setSelectedDesign, resetOnboardStore } = useDispatch( ONBOARD_STORE );

	const handleStartOverButtonClick = () => {
		resetOnboardStore();
	};

	const getDesignUrl = ( design: Design, title: string ) =>
		addQueryArgs( design.src, {
			vertical: siteVertical?.label,
			font_headings: design.fonts[ 0 ],
			font_base: design.fonts[ 1 ],
			site_title: title,
		} );

	return (
		<div className="design-selector">
			<div className="design-selector__header">
				<div className="design-selector__heading">
					<Title>{ NO__( 'Choose a starting design' ) }</Title>
					<SubTitle>
						{ NO__(
							'Get started with one of our top website layouts. You can always change it later'
						) }
					</SubTitle>
				</div>
				<Link
					className="design-selector__start-over-button"
					onClick={ handleStartOverButtonClick }
					to={ makePath( Step.IntentGathering ) }
					isLink
				>
					{ NO__( 'Start over' ) }
				</Link>
			</div>
			<div className="design-selector__design-grid">
				<div className="design-selector__grid">
					{ designs.featured.map( design => (
						<button
							key={ design.slug }
							className={ classnames(
								'design-selector__design-option',
								design.slug === selectedDesign?.slug ? 'selected' : null
							) }
							onClick={ () => {
								setSelectedDesign( design );
								if ( isEnabled( 'gutenboarding/style-preview' ) ) {
									push( makePath( Step.Style ) );
								}
							} }
						>
							<div className="design-selector__image-frame">
								<iframe
									title={ design.title }
									className="design-selector__frame"
									src={ getDesignUrl( design, siteTitle ) }
									scrolling="no"
									sandbox=""
								/>
								<div className="design-selector__iframe-overlay" />
							</div>
							<span className="design-selector__option-overlay">
								<span className="design-selector__option-name">{ design.title }</span>
							</span>
						</button>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default DesignSelector;
