/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import { localize } from 'i18n-calypso';
import page from 'page';

/**
 * Internal dependencies
 */
import { withLocalizedMoment } from 'components/localized-moment';
import Gridicon from 'components/gridicon';
import Button from 'components/forms/form-button';

/**
 * Style dependencies
 */
import './style.scss';

class DailyBackupStatus extends Component {
	// TODO: now that we are reusing URLs we should have a dedicated paths file
	createRestoreUrl = restoreId => `/backups/${ this.props.siteSlug }/restore/${ restoreId }`;
	createDownloadUrl = downloadId => `/backups/${ this.props.siteSlug }/download/${ downloadId }`;

	triggerRestore = () => {
		const restoreId = this.props.backupAttempts.complete[ 0 ].rewindId;
		page.redirect( this.createRestoreUrl( restoreId ) );
	};

	triggerDownload = () => {
		const downloadId = this.props.backupAttempts.complete[ 0 ].rewindId;
		page.redirect( this.createDownloadUrl( downloadId ) );
	};

	renderGoodBackup() {
		const { allowRestore, backupAttempts, moment, translate } = this.props;

		const displayDate = moment( backupAttempts.complete[ 0 ].activityDate ).format(
			'MMMM Do YYYY, h:mm a'
		);

		return (
			<Fragment>
				<Gridicon className="daily-backup-status__status-icon" icon="cloud-upload" />
				<div className="daily-backup-status__label">
					<Fragment>{ translate( 'Latest: ' ) }</Fragment>
					<Fragment>{ displayDate }</Fragment>
				</div>
				<Button
					isPrimary={ false }
					className="daily-backup-status__download-button"
					onClick={ this.triggerDownload }
				>
					{ translate( 'Download backup' ) }
				</Button>
				<Button
					className="daily-backup-status__restore-button"
					disabled={ ! allowRestore }
					onClick={ this.triggerRestore }
				>
					{ translate( 'Restore to this point' ) }
				</Button>
			</Fragment>
		);
	}

	renderFailedBackup() {
		const { backupAttempts, date, moment, translate } = this.props;

		const hasBackupError = backupAttempts.error.length;
		const errorMessage =
			hasBackupError && backupAttempts.error[ 0 ].activityDescription[ 0 ].children[ 0 ].text;

		const displayDate = hasBackupError
			? moment( backupAttempts.error[ 0 ].activityDate ).format( 'MMMM Do, YYYY, h:mm a' )
			: moment( date ).format( 'MMMM Do, YYYY' );

		return (
			<Fragment>
				<Gridicon icon="cross-circle" className="daily-backup-status__gridicon-error-state" />
				<div className="daily-backup-status__warning">
					{ hasBackupError
						? translate( 'Backup attempt failed' )
						: translate( 'Backup not found' ) }
				</div>
				<div className="daily-backup-status__label">{ displayDate }</div>
				<div className="daily-backup-status__message">
					{ hasBackupError
						? translate(
								'A backup for your site was attempted %(dd)s and was not able to be completed.',
								{ args: { dd: displayDate.replace( ',', ' at' ) } }
						  )
						: translate( 'A backup was not attempted for this day.' ) }
				</div>
				<div className="daily-backup-status__message">
					{ translate(
						'Check out the {{link}}backups help guide{{/link}} or contact our support team to resolve the issue.',
						{
							components: {
								link: <a href="#" />,
							},
						}
					) }
				</div>
				<Button
					className="daily-backup-status__support-button"
					isPrimary={ false }
					onClick={ () => {} }
				>
					{ translate( 'Contact support' ) }
				</Button>
			</Fragment>
		);
	}

	render() {
		const { backupAttempts } = this.props;
		const dateHasGoodBackup = backupAttempts.complete.length;

		return (
			<div className="daily-backup-status">
				{ dateHasGoodBackup ? this.renderGoodBackup() : this.renderFailedBackup() }
			</div>
		);
	}
}

export default localize( withLocalizedMoment( DailyBackupStatus ) );
