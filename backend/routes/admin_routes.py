from flask import Blueprint, request, jsonify
from config import Config
from services.firebase_service import firebase_service
from services.telegram_service import telegram_service

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    """
    Admin Authentication Endpoint.
    Validates admin credentials securely.
    """
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if email == Config.ADMIN_EMAIL and password == Config.ADMIN_PASSWORD:
            return jsonify({
                'success': True,
                'message': 'Admin authentication successful',
                'token': 'auth-token-admin-swachh-bharat-2026',
                'user': {
                    'email': email,
                    'role': 'MUNICIPAL_ADMIN'
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid admin email or password'
            }), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/telegram/test', methods=['POST', 'GET'])
def test_telegram():
    """
    Independent diagnostic endpoint to test Telegram integration.
    """
    try:
        success, message = telegram_service.test_telegram_connection()
        if success:
            return jsonify({
                'success': True,
                'message': 'Telegram diagnostic test message sent successfully to municipal admin chat.'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': f"Telegram diagnostic test failed: {message}"
            }), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/complaints/<complaint_id>/status', methods=['PATCH'])
def update_status(complaint_id):
    """
    Updates status for a specific complaint.
    Statuses: NEW, VERIFIED, CLEANING_TEAM_ASSIGNED, CLEANING_IN_PROGRESS, RESOLVED, REJECTED
    """
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        valid_statuses = {'NEW', 'VERIFIED', 'CLEANING_TEAM_ASSIGNED', 'CLEANING_IN_PROGRESS', 'RESOLVED', 'REJECTED'}
        
        if not new_status or new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), 400

        updated = firebase_service.update_complaint_status(complaint_id, new_status)
        if updated:
            updated_complaint = firebase_service.get_complaint_by_id(complaint_id)
            return jsonify({
                'success': True,
                'message': f"Complaint status updated to {new_status}",
                'complaint': updated_complaint
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Complaint not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/complaints/<complaint_id>/assign-cleaning-team', methods=['POST'])
def assign_cleaning_team(complaint_id):
    """
    Action button handler to assign sanitation/cleaning response team.
    """
    try:
        updated = firebase_service.update_complaint_status(
            complaint_id,
            'CLEANING_TEAM_ASSIGNED',
            extra_fields={'assignedAt': request.get_json().get('assignedAt') if request.get_json() else None}
        )
        if updated:
            updated_complaint = firebase_service.get_complaint_by_id(complaint_id)
            return jsonify({
                'success': True,
                'message': 'Sanitation team assigned successfully.',
                'complaint': updated_complaint
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Complaint not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
