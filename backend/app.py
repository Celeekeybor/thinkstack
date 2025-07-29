from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
from io import StringIO
import csv
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hackathon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change in production
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static/uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)  # Enable CORS for frontend

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    github_url = db.Column(db.String(200), nullable=False)
    tech_stack = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='Pending')
    score = db.Column(db.Integer, nullable=True)
    file_path = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Root route to avoid 404
@app.route('/')
def index():
    return jsonify({'message': 'Welcome to ThinkStack Hackathon API'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all([data.get('username'), data.get('email'), data.get('password')]):
        return jsonify({'message': 'All fields are required'}), 400
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
    return jsonify({'message': 'User registered'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = db.session.query(User).filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    access_token = create_access_token(identity={'id': user.id, 'is_admin': user.is_admin})
    return jsonify({'access_token': access_token, 'is_admin': user.is_admin})

@app.route('/api/submit', methods=['POST'])
@jwt_required()
def submit_project():
    identity = get_jwt_identity()
    data = request.form
    file = request.files.get('file')
    if not all([data.get('title'), data.get('description'), data.get('github_url'), data.get('tech_stack')]):
        return jsonify({'message': 'All fields are required'}), 400
    submission = Submission(
        user_id=identity['id'],
        title=data['title'],
        description=data['description'],
        github_url=data['github_url'],
        tech_stack=data['tech_stack']
    )
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        submission.file_path = f"/static/uploads/{filename}"
    db.session.add(submission)
    db.session.commit()
    return jsonify({'message': 'Project submitted'}), 201

@app.route('/api/submissions', methods=['GET'])
@jwt_required()
def get_submissions():
    identity = get_jwt_identity()
    if identity['is_admin']:
        submissions = db.session.query(Submission).all()
    else:
        submissions = db.session.query(Submission).filter_by(user_id=identity['id']).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'description': s.description,
        'github_url': s.github_url,
        'tech_stack': s.tech_stack,
        'status': s.status,
        'score': s.score,
        'file_path': s.file_path,
        'username': db.session.query(User).get(s.user_id).username
    } for s in submissions])

@app.route('/api/submissions/<int:id>', methods=['PUT'])
@jwt_required()
def update_submission(id):
    identity = get_jwt_identity()
    if not identity['is_admin']:
        return jsonify({'message': 'Admin access required'}), 403
    submission = db.session.query(Submission).get_or_404(id)
    data = request.get_json()
    submission.status = data.get('status', submission.status)
    submission.score = data.get('score', submission.score)
    db.session.commit()
    return jsonify({'message': 'Submission updated'})

@app.route('/api/submissions/<int:id>', methods=['PATCH'])
@jwt_required()
def edit_submission(id):
    identity = get_jwt_identity()
    submission = db.session.query(Submission).get_or_404(id)
    if submission.user_id != identity['id'] or submission.status != 'Pending':
        return jsonify({'message': 'Unauthorized or submission locked'}), 403
    data = request.get_json()
    submission.title = data.get('title', submission.title)
    submission.description = data.get('description', submission.description)
    submission.github_url = data.get('github_url', submission.github_url)
    submission.tech_stack = data.get('tech_stack', submission.tech_stack)
    db.session.commit()
    return jsonify({'message': 'Submission updated'})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    submissions = db.session.query(Submission).filter(Submission.score.isnot(None)).order_by(Submission.score.desc()).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'username': db.session.query(User).get(s.user_id).username,
        'tech_stack': s.tech_stack,
        'score': s.score,
        'status': s.status
    } for s in submissions])

@app.route('/api/stats', methods=['GET'])
@jwt_required()
def stats():
    if not get_jwt_identity()['is_admin']:
        return jsonify({'message': 'Admin access required'}), 403
    total = db.session.query(Submission).count()
    by_status = {
        'Pending': db.session.query(Submission).filter_by(status='Pending').count(),
        'Approved': db.session.query(Submission).filter_by(status='Approved').count(),
        'Rejected': db.session.query(Submission).filter_by(status='Rejected').count()
    }
    return jsonify({'total': total, 'by_status': by_status})

@app.route('/api/tech-stats', methods=['GET'])
@jwt_required()
def tech_stats():
    if not get_jwt_identity()['is_admin']:
        return jsonify({'message': 'Admin access required'}), 403
    submissions = db.session.query(Submission).all()
    tech_counts = {}
    for s in submissions:
        for tech in s.tech_stack.split(','):
            tech = tech.strip()
            tech_counts[tech] = tech_counts.get(tech, 0) + 1
    return jsonify(tech_counts)

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    identity = get_jwt_identity()
    user = db.session.query(User).get_or_404(identity['id'])
    submissions = db.session.query(Submission).filter_by(user_id=user.id).all()
    return jsonify({
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'submissions': [{
            'id': s.id,
            'title': s.title,
            'tech_stack': s.tech_stack,
            'status': s.status,
            'score': s.score
        } for s in submissions]
    })

@app.route('/api/export-submissions', methods=['GET'])
@jwt_required()
def export_submissions():
    identity = get_jwt_identity()
    if not identity['is_admin']:
        return jsonify({'message': 'Admin access required'}), 403
    submissions = db.session.query(Submission).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Title', 'Username', 'Tech Stack', 'Status', 'Score'])
    for s in submissions:
        username = db.session.query(User).get(s.user_id).username
        writer.writerow([s.id, s.title, username, s.tech_stack, s.status, s.score or ''])
    output.seek(0)
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name='submissions.csv'
    )

if __name__ == '__main__':
    app.run(debug=True)