from flask import Flask, jsonify, request, abort, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure the SQLAlchemy part of the app instance
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vocab.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Create an SQLAlchemy object to handle our database
db = SQLAlchemy(app)

# Define a model for the WordPair
class WordPair(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    german = db.Column(db.String(80), unique=True, nullable=False)
    correct = db.Column(db.String(80), nullable=False)
    incorrect1 = db.Column(db.String(80), nullable=False)
    incorrect2 = db.Column(db.String(80), nullable=False)
    incorrect3 = db.Column(db.String(80), nullable=False)
    priority = db.Column(db.String(10), default="high")

# Flask route for adding a new word
@app.route('/word', methods=['POST'])
def add_word():
    if not request.json or not 'german' in request.json:
        abort(400)
    word = WordPair(german=request.json['german'],
                    correct=request.json['correct'],
                    incorrect=request.json['incorrect'],
                    priority=request.json.get('priority', "high"))
    db.session.add(word)
    db.session.commit()
    return jsonify({'german': word.german}), 201

# Flask route for getting words by priority
@app.route('/words', methods=['GET'])
def get_words():
    priority = request.args.get('priority', type=str)
    if priority == 'all':
        words = WordPair.query.all()
    else:
        words = WordPair.query.filter_by(priority=priority).all()
    return jsonify([
        {
            'id': word.id,
            'german': word.german,
            'correct': word.correct,
            'incorrect1': word.incorrect1,
            'incorrect2': word.incorrect2,
            'incorrect3': word.incorrect3,
            'priority': word.priority
        } for word in words
    ])

# Flask route for updating a word's priority
@app.route('/word/<int:word_id>', methods=['PUT'])
def update_priority(word_id):
    word = WordPair.query.get(word_id)
    if not word:
        abort(404)
    if not request.json:
        abort(400)
    word.priority = request.json.get('priority', word.priority)
    db.session.commit()
    return jsonify({'german': word.german, 'priority': word.priority})

# Toggle word priority
@app.route('/word/toggle_priority/<int:word_id>', methods=['POST'])
def toggle_priority(word_id):
    word = WordPair.query.get_or_404(word_id)
    word.priority = "low" if word.priority == "high" else "high"
    db.session.commit()
    return jsonify({'german': word.german, 'priority': word.priority})

# Route to serve the quiz HTML
@app.route('/')
def index():
    return render_template('quiz.html')

# Create the database and start the app
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
