from flask import Flask, send_from_directory, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from flask_cors import CORS
from db import db, User, Submission
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hackathon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with secure key
app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key'  # Replace with secure key

db.init_app(app)
JWTManager(app)
Migrate(app, db)
CORS(app)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if db.session.query(User).filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        is_admin=data.get('is_admin', False)
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = db.session.query(User).filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity={'id': user.id, 'is_admin': user.is_admin})
        return jsonify({'access_token': access_token, 'user_id': user.id, 'is_admin': user.is_admin})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/submit', methods=['POST'])
@jwt_required()
def submit_project():
    data = request.get_json()
    user = get_jwt_identity()
    submission = Submission(
        user_id=user['id'],
        title=data['title'],
        description=data['description'],
        github_url=data['github_url'],
        tech_stack=data['tech_stack']
    )
    db.session.add(submission)
    db.session.commit()
    return jsonify({'message': 'Project submitted successfully'}), 201

@app.route('/api/submissions', methods=['GET'])
@jwt_required()
def get_submissions():
    submissions = db.session.query(Submission).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'description': s.description,
        'github_url': s.github_url,
        'tech_stack': s.tech_stack,
        'status': s.status,
        'score': s.score
    } for s in submissions])

@app.route('/api/submissions/<int:id>', methods=['PUT'])
@jwt_required()
def update_submission(id):
    identity = get_jwt_identity()
    if not identity['is_admin']:
        return jsonify({'message': 'Admin access required'}), 403
    data = request.get_json()
    submission = db.session.query(Submission).get_or_404(id)
    submission.status = data.get('status', submission.status)
    submission.score = data.get('score', submission.score)
    db.session.commit()
    return jsonify({'message': 'Submission updated'})

@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    identity = get_jwt_identity()
    if not identity['is_admin']:
        return jsonify({'message': 'Admin access required'}), 403
    stats = {
        'total_submissions': db.session.query(Submission).count(),
        'by_status': {
            'Pending': db.session.query(Submission).filter_by(status='Pending').count(),
            'Approved': db.session.query(Submission).filter_by(status='Approved').count(),
            'Rejected': db.session.query(Submission).filter_by(status='Rejected').count()
        }
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)